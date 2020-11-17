import { Around, Aspect } from '@aspectjs/core/annotations';
import { AroundContext, AspectError, BeforeContext, JoinPoint, on } from '@aspectjs/core/commons';
import { getOrComputeMetadata, getProto, isFunction, isString, isUndefined } from '@aspectjs/core/utils';

import { stringify } from 'flatted';
import copy from 'fast-copy';

import { MemoDriver, MemoFrame } from './drivers';
import { MemoEntry, MemoKey } from './memo.types';
import { Memo, MemoOptions } from './memo.annotation';
import { VersionConflictError } from './errors';
import { murmurhash, Mutable, provider } from './utils';
import { MarshallersRegistry } from './marshalling/marshallers-registry';
import {
    ArrayMarshaller,
    BasicMarshaller,
    CacheableMarshaller,
    DateMarshaller,
    MemoMarshaller,
    ObjectMarshaller,
    PromiseMarshaller,
} from './marshalling/marshallers';

/**
 * @public marshallers that gets configured with default MemoAspect
 */
export const DEFAULT_MARSHALLERS: MemoMarshaller[] = [
    new ObjectMarshaller(),
    new ArrayMarshaller(),
    new DateMarshaller(),
    new PromiseMarshaller(),
    new CacheableMarshaller(),
    new BasicMarshaller(),
];
Object.freeze(DEFAULT_MARSHALLERS);

const MEMO_ID_REFLECT_KEY = '@aspectjs:memo/id';
let internalId = 0;

/**
 * Options accepted by MemoAspect
 * @public
 */
export interface MemoAspectOptions {
    namespace?: string | (() => string);
    expiration?: Date | number | (() => Date | number);
    id?: string | number | ((ctxt: BeforeContext<any, any>) => string | number);
    contextKey?: (ctxt: BeforeContext<any, any>) => MemoKey | string;
    marshallers?: MemoMarshaller[];
    drivers?: MemoDriver[];
}

const DEFAULT_MEMO_ASPECT_OPTIONS: Required<MemoAspectOptions> = {
    id: (ctxt: BeforeContext<any, any>) => {
        const { id, _id, hashcode, _hashcode } = ctxt.instance;
        const result = id ?? _id ?? hashcode ?? _hashcode;
        if (isUndefined(result)) {
            return getOrComputeMetadata(MEMO_ID_REFLECT_KEY, ctxt.instance, () => internalId++);
        }
        return result;
    },
    namespace: '',
    contextKey: (ctxt: BeforeContext<any, any>) => {
        return new MemoKey({
            namespace: ctxt.data.namespace,
            instanceId: ctxt.data.instanceId,
            argsKey: murmurhash(stringify(ctxt.args)),
            targetKey: ctxt.target.ref,
        });
    },
    expiration: undefined,
    marshallers: DEFAULT_MARSHALLERS,
    drivers: [],
};

/**
 * Enable Memoization of a method's return value.
 * @public
 */
@Aspect('@aspectjs/memo')
export class MemoAspect {
    protected _options: MemoAspectOptions;
    private readonly _drivers: Record<string, MemoDriver> = {};
    /** maps memo keys with its unregister function for garbage collector timeouts */
    private readonly _entriesGc: Record<string, number> = {};
    private _marshallers: MarshallersRegistry;
    private _pendingResults: Record<string, any> = {};

    constructor(params?: MemoAspectOptions) {
        this._options = { ...DEFAULT_MEMO_ASPECT_OPTIONS, ...params };
        this._marshallers = new MarshallersRegistry();
        this.addMarshaller(...DEFAULT_MARSHALLERS, ...(this._options.marshallers ?? []));
        this.addDriver(...(params?.drivers ?? []));
    }

    getDrivers(): Record<string, MemoDriver> {
        return this._drivers;
    }

    public addDriver(...drivers: MemoDriver[]): this {
        (drivers ?? []).forEach((d) => {
            if (this._drivers[d.NAME] === d) {
                return;
            }
            if (this._drivers[d.NAME]) {
                throw new Error(
                    `both ${d.constructor?.name} & ${this._drivers[d.NAME].constructor?.name} configured for name ${
                        d.NAME
                    }`,
                );
            }
            this._drivers[d.NAME] = d;
            this._initGc(d);
        });
        return this;
    }

    addMarshaller(...marshallers: MemoMarshaller[]): void {
        this._marshallers.addMarshaller(...marshallers);
    }

    /**
     * Apply the memo pattern. That is, get the result from cache if any, or call the original method and store the result otherwise.
     */
    @Around(on.method.withAnnotations(Memo))
    applyMemo(ctxt: AroundContext<any, any>, jp: JoinPoint): any {
        const memoParams = ctxt.annotation.args[0] as MemoOptions;
        ctxt.data.namespace = provider(memoParams?.namespace)() ?? provider(this._options?.namespace)();
        ctxt.data.instanceId = `${provider(memoParams?.id)(ctxt) ?? provider(this._options?.id)(ctxt)}`;
        const key = this._options.contextKey(ctxt) as MemoKey;

        if (!key) {
            throw new Error('memo key is not defined');
        }

        const options = ctxt.annotation.args[0] as MemoOptions;
        const expiration = this.getExpiration(ctxt, options);
        const drivers = _selectCandidateDrivers(this._drivers, ctxt);

        const proceedJoinpoint = () => {
            // value not cached. Call the original method
            const value = (this._pendingResults[key.toString()] = jp());

            // marshall the value into a frame
            const marshallingContext = this._marshallers.marshal(key, value);

            const driver = drivers
                .filter((d) => d.accepts(marshallingContext))
                .map((d) => [d, d.getPriority(marshallingContext)])
                .sort((dp1: any, dp2: any) => dp2[1] - dp1[1])
                .map((dp) => dp[0])[0] as MemoDriver;

            if (!driver) {
                throw new AspectError(
                    ctxt,
                    `Driver ${drivers[0].NAME} does not accept value of type ${
                        getProto(value)?.constructor?.name ?? typeof value
                    } returned by ${ctxt.target.label}`,
                );
            }

            if (expiration) {
                this._scheduleCleaner(driver, key, expiration);
            }

            marshallingContext.then((frame: MemoFrame<any>) => {
                // promise resolution may not arrive in time in case the same method is called right after.
                // store the result in a temporary variable in order to be available right away
                const entry = {
                    key,
                    expiration,
                    frame: undefined as MemoFrame,
                } as Mutable<MemoEntry>;

                entry.frame = frame;
                driver.setValue(entry).then(() => {
                    if (this._pendingResults[key.toString()] === value) {
                        delete this._pendingResults[key.toString()];
                    }
                });
            });
            return value;
        };

        if (this._pendingResults[key.toString()]) {
            return copy(this._pendingResults[key.toString()]);
        }
        for (const d of drivers) {
            try {
                const entry = d.getValue(key);
                if (entry) {
                    if (entry.expiration && entry.expiration < new Date()) {
                        // remove data if expired
                        this._removeValue(d, key);
                    } else {
                        return this._marshallers.unmarshal(key, entry.frame);
                    }
                }
            } catch (e) {
                // mute errors in ase of version mismatch, & just remove old version
                if (e instanceof VersionConflictError) {
                    this._removeValue(d, e.context.key);
                } else {
                    throw e;
                }
            }
        }

        // found no driver for this value. Call the real method
        return proceedJoinpoint();
    }

    private _removeValue(driver: MemoDriver, key: MemoKey): void {
        driver.remove(key);
        // get gc timeout handle
        const t = this._entriesGc[key.toString()];
        delete this._pendingResults[key.toString()];

        if (t !== undefined) {
            // this entry is not eligible for gc
            delete this._entriesGc[key.toString()];

            // remove gc timeout
            clearTimeout(t as number);
        }
    }

    private _scheduleCleaner(driver: MemoDriver, key: MemoKey, expiration: Date): void {
        const ttl = expiration.getTime() - new Date().getTime();
        if (ttl <= 0) {
            this._removeValue(driver, key);
        } else {
            this._entriesGc[key.toString()] = setTimeout(() => this._removeValue(driver, key), ttl) as any;
        }
    }

    private _initGc(driver: MemoDriver): void {
        driver.getKeys().then((keys) => {
            keys.forEach((k) => {
                Promise.resolve(driver.getValue(k)).then((memo) => {
                    this._scheduleCleaner(driver, k, memo.expiration);
                });
            });
        });
    }

    private getExpiration(ctxt: AroundContext<any, any>, options: MemoOptions): Date | undefined {
        const exp = provider(options?.expiration)();
        if (exp) {
            if (exp instanceof Date) {
                return exp;
            } else if (typeof exp === 'number' && exp > 0) {
                return new Date(new Date().getTime() + exp * 1000);
            } else if (exp === 0) {
                return;
            }

            throw new AspectError(ctxt, `expiration should be either a Date or a positive number. Got: ${exp}`);
        }
    }
}

function _selectCandidateDrivers(drivers: Record<string, MemoDriver>, ctxt: AroundContext<any, any>): MemoDriver[] {
    const annotationOptions = (ctxt.annotation.args[0] ?? {}) as MemoOptions;
    if (!annotationOptions.driver) {
        // return all drivers
        return Object.values(drivers);
    } else {
        if (isString(annotationOptions.driver)) {
            const candidates = Object.values(drivers).filter((d) => d.NAME === annotationOptions.driver);
            if (!candidates.length) {
                throw new AspectError(
                    ctxt,
                    `No candidate driver available for driver name "${annotationOptions.driver}"`,
                );
            }

            return candidates;
        } else if (isFunction(annotationOptions.driver)) {
            const candidates = Object.values(drivers).filter((d) => d.constructor === annotationOptions.driver);
            if (!candidates.length) {
                throw new AspectError(
                    ctxt,
                    `No candidate driver available for driver "${annotationOptions.driver?.name}"`,
                );
            }
            return candidates;
        } else {
            throw new AspectError(
                ctxt,
                `driver option should be a string or a Driver constructor. Got: ${annotationOptions.driver}`,
            );
        }
    }
}
