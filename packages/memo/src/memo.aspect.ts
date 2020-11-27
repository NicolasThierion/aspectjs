import { Around, Aspect } from '@aspectjs/core/annotations';
import { AroundContext, AspectError, AspectType, BeforeContext, JoinPoint, on } from '@aspectjs/core/commons';
import { getOrComputeMetadata, getProto, isFunction, isString, isUndefined } from '@aspectjs/core/utils';
import copy from 'fast-copy';

import { stringify } from 'flatted';

import { MemoDriver, MemoFrame } from './drivers';
import { VersionConflictError } from './errors';
import {
    ArrayMarshaller,
    BasicMarshaller,
    CacheableMarshaller,
    DateMarshaller,
    MemoMarshaller,
    ObjectMarshaller,
    PromiseMarshaller,
} from './marshalling/marshallers';
import { MarshallersRegistry } from './marshalling/marshallers-registry';
import { Memo, MemoOptions } from './memo.annotation';
import { MemoEntry, MemoKey } from './memo.types';
import { hash, Mutable, provider } from './utils';

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
    /** use a namespace to avoid collision of data between eg: 2 different users */
    namespace?: string | (() => string);
    /** configure cache expiration in milliseconds or at a given specific date */
    expiration?: Date | number | (() => Date | number);
    /** get the identity of the class whose methods generates memoized data */
    id?: string | number | ((ctxt: BeforeContext<any, any>) => string | number);
    /** function that based on the execution context, generates the key to store cached data  */
    createMemoKey?: (ctxt: BeforeContext<any, any>) => MemoKey | string;
    /** marshallers to transform objects from / to storable structure */
    marshallers?: MemoMarshaller[];
    /** drivers that do the actual storage **/
    drivers?: MemoDriver[];
}

const DEFAULT_MEMO_ASPECT_OPTIONS: Required<MemoAspectOptions> = {
    id: (ctxt: BeforeContext<any>) => {
        const { id, _id, hashcode, _hashcode } = ctxt.instance;
        const result = id ?? _id ?? hashcode ?? _hashcode;
        if (isUndefined(result)) {
            return getOrComputeMetadata(MEMO_ID_REFLECT_KEY, ctxt.instance, () => internalId++);
        }
        return result;
    },
    namespace: '',
    createMemoKey: (ctxt: BeforeContext<any>) => {
        return new MemoKey({
            namespace: ctxt.data.namespace,
            instanceId: ctxt.data.instanceId,
            argsKey: hash(stringify(ctxt.args)),
            targetKey: hash(`${ctxt.target.ref}`),
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
export class MemoAspect implements AspectType {
    protected _options: MemoAspectOptions;
    private readonly _drivers: Record<string, MemoDriver> = {};
    /** maps memo keys with its unregister function for garbage collector timeouts */
    private readonly _entriesGc: Record<string, number> = {};
    private _marshallers: MarshallersRegistry;
    private _pendingResults: Record<string, any> = {};
    private _enabled: boolean;

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
            if (this._enabled) {
                this._initGc(d);
            }
        });
        return this;
    }

    onEnable() {
        this._enabled = true;
        Object.values(this._drivers).forEach((d) => this._initGc(d));
    }

    addMarshaller(...marshallers: MemoMarshaller[]): void {
        this._marshallers.addMarshaller(...marshallers);
    }

    /**
     * Apply the memo pattern. That is, get the result from cache if any, or call the original method and store the result otherwise.
     */
    @Around(on.method.withAnnotations(Memo))
    applyMemo(ctxt: AroundContext<any>, jp: JoinPoint): any {
        const memoParams = ctxt.annotations.onSelf(Memo)[0].args[0] as MemoOptions;
        ctxt.data.namespace = provider(memoParams?.namespace)() ?? provider(this._options?.namespace)();
        ctxt.data.instanceId = `${provider(memoParams?.id)(ctxt) ?? provider(this._options?.id)(ctxt)}`;
        const key = this._options.createMemoKey(ctxt) as MemoKey;

        if (!key) {
            throw new Error(`${this._options.createMemoKey.name} function did not return a valid MemoKey`);
        }

        const options = ctxt.annotations.onSelf(Memo)[0].args[0] as MemoOptions;
        const expiration = this.getExpiration(ctxt, options);
        const drivers = _selectCandidateDrivers(this._drivers, ctxt, this.applyMemo);

        const proceedJoinpoint = () => {
            // value not cached. Call the original method
            const value = (this._pendingResults[key.toString()] = jp());

            // marshall the value into a frame
            const marshallingContext = this._marshallers.marshal(value);

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
                    frame,
                    signature: __createContextSignature(ctxt),
                } as Mutable<MemoEntry>;

                driver.write(entry).then(() => {
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
                const entry = d.read(key);
                if (entry) {
                    if (entry.expiration && entry.expiration < new Date()) {
                        // remove data if expired
                        this._removeValue(d, key);
                    } else if (entry.signature && entry.signature !== __createContextSignature(ctxt)) {
                        // remove data if signature mismatch
                        console.debug(`${ctxt.target.label} hash mismatch. Removing memoized data...`);
                        this._removeValue(d, key);
                    } else {
                        return this._marshallers.unmarshal(entry.frame);
                    }
                }
            } catch (e) {
                // mute errors in ase of version mismatch, & just remove old version
                if (e instanceof VersionConflictError) {
                    this._removeValue(d, key);
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
                Promise.resolve(driver.read(k)).then((memo) => {
                    if (memo?.expiration) {
                        this._scheduleCleaner(driver, k, memo.expiration);
                    }
                });
            });
        });
    }

    private getExpiration(ctxt: AroundContext<any>, options: MemoOptions): Date | undefined {
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

function _selectCandidateDrivers(
    drivers: Record<string, MemoDriver>,
    ctxt: AroundContext<any, any>,
    applyMemo: Function,
): MemoDriver[] {
    const annotationOptions = (ctxt.annotations.onSelf(Memo)[0].args[0] ?? {}) as MemoOptions;
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

function __createContextSignature(ctxt: AroundContext<unknown>) {
    const s: string[] = [];
    let proto = ctxt.target.proto as any;
    let property = proto[ctxt.target.propertyKey];
    while (proto !== Object.prototype && property) {
        s.push(ctxt.target.proto[ctxt.target.propertyKey].toString());
        proto = Reflect.getPrototypeOf(proto);
        property = proto[ctxt.target.propertyKey];
    }

    return hash(s.join());
}
