import { assert, isArray, isObject, isPromise, isUndefined, provider } from '../utils';
import { CacheableAspect, CacheTypeStore } from '../cacheable/cacheable.aspect';
import { getWeaver } from '@aspectjs/core';
import { parse, stringify } from 'flatted';
import { diff, valid } from 'semver';
import { VersionConflictError } from '../errors';
import SemVer from 'semver/classes/semver';
import { DeserializationContext, MemoKey, MemoSerializer, MemoValue, SerializationContext } from '../memo.types';
import { MemoWrap, MemoWrapper } from './memo-wrap';
import { WeavingError } from '@aspectjs/core/src/weaver/errors/weaving-error';

export interface MemoDriverOptions {
    serializer?: MemoSerializer;
    typeWrappers?: {
        '*'?: MemoWrapper; // default type handler
        [typeName: string]: MemoWrapper;
    };
}

export const NOOP_WRAPPER: MemoWrapper = {
    unwrap<T>(wrap: MemoWrap<T>): T {
        return wrap.value;
    },
    wrap<T>(wrap: MemoWrap<T>): MemoWrap<T> {
        return wrap;
    },
};

export const DEFAULT_TYPE_HANDLERS: MemoDriverOptions['typeWrappers'] = {
    Object: {
        unwrap(wrap: MemoWrap<object>, context: DeserializationContext): object {
            if (wrap.value === null) {
                return null;
            }
            let value = {};
            context.blacklist.set(wrap, value);

            value = ([] as (string | symbol)[])
                .concat(Object.getOwnPropertyNames(wrap.value))
                .concat(Object.getOwnPropertySymbols(wrap.value))
                .reduce((v, k) => {
                    v[k] = context.defaultUnwrap((wrap.value as any)[k]);
                    return v;
                }, value as any);

            return value;
        },

        wrap(wrap: MemoWrap<object>, value: object, context: SerializationContext): MemoWrap<object> {
            if (value !== null) {
                context.blacklist.set(value, wrap);

                // entries may contain promises
                const promises: Promise<any>[] = [];

                wrap.value = ([] as (string | symbol)[])
                    .concat(Object.getOwnPropertyNames(value))
                    .concat(Object.getOwnPropertySymbols(value))
                    .reduce((w, k) => {
                        const v = (value as any)[k];

                        if (isPromise(v)) {
                            promises.push(v.then(r => (w[k] = context.defaultWrap(r))));
                        } else {
                            w[k] = context.defaultWrap(v);
                        }

                        return w;
                    }, wrap.value as any);

                context.async.push(...promises);
            }

            return wrap;
        },
    },
    Array: {
        unwrap(wrap: MemoWrap<unknown[]>, context: DeserializationContext): unknown[] {
            // assert(wrapped[F.TYPE] === ValueType.ARRAY);
            const value = [] as any[];

            context.blacklist.set(wrap, value);
            value.push(...((wrap.value as any) as any[]).map(w => context.defaultUnwrap(w)));
            return value;
        },
        wrap(
            wrap: MemoWrap<unknown[]>,
            value: unknown[],
            context: SerializationContext,
        ): MemoWrap<any[]> | Promise<MemoWrap<any[]>> {
            wrap.value = [];
            context.blacklist.set(value, wrap);

            const array = value as any[];

            // array may contain promises
            const promises: Promise<any>[] = [];
            array.forEach((v, i) => {
                if (isPromise(v)) {
                    promises.push(v.then(r => (wrap.value[i] = context.defaultWrap(r))));
                } else {
                    wrap.value[i] = context.defaultWrap(v);
                }
            });

            context.async.push(...promises);

            return wrap;
        },
    },
    Date: {
        wrap(wrap: MemoWrap<Date>, value: Date): MemoWrap<Date> {
            wrap.value = stringify(value) as any;
            return wrap;
        },
        unwrap(wrap: MemoWrap<Date>): Date {
            return new Date(parse(wrap.value as any));
        },
    },
    Promise: {
        unwrap(wrap: MemoWrap, context: DeserializationContext): Promise<any> {
            return Promise.resolve(context.defaultUnwrap(wrap.value));
        },
        wrap(wrap: MemoWrap<unknown>, value: Promise<unknown>, context: SerializationContext): Promise<MemoWrap> {
            return value.then(v => {
                wrap.value = context.defaultWrap(v);
                return wrap;
            });
        },
    },
    '*': {
        wrap(wrap: MemoWrap<object>, value: any, context: SerializationContext): MemoWrap | Promise<MemoWrap> {
            // delete wrap.type; // Do not store useless type, as INSTANCE_TYPE is used for objects of non-built-in types.
            const proto = Reflect.getPrototypeOf(value);

            return _resolve(DEFAULT_TYPE_HANDLERS.Object.wrap(wrap, value, context), w => {
                const type = context.typeStore.getTypeKey(proto);
                w.instanceType = type;
                w.version = provider(context.typeStore.getVersion(type))();
                // Reflect.setPrototypeOf(w.value, proto);
                return w;
            });
        },
        unwrap(wrap: MemoWrap<any>, context: DeserializationContext): any {
            const value = DEFAULT_TYPE_HANDLERS.Object.unwrap(wrap, context);

            assert(!!wrap.instanceType);
            const proto = context.typeStore.getPrototype(wrap.instanceType);
            const version = provider(context.typeStore.getVersion(wrap.instanceType))();
            if (version !== wrap.version) {
                if (!(valid(version) && valid(wrap.version) && satisfies(version, wrap.version))) {
                    throw new VersionConflictError(
                        `Object for key ${wrap.instanceType} is of version ${version}, but incompatible version ${wrap.version} was already cached`,
                        context,
                    );
                }
            }

            Reflect.setPrototypeOf(value, proto);

            return value;
        },
    },
};
DEFAULT_TYPE_HANDLERS['object'] = DEFAULT_TYPE_HANDLERS['Object'];
const BASIC_TYPES = ['Number', 'String', 'Boolean', 'Symbol'];
BASIC_TYPES.push(...BASIC_TYPES.map(t => t.toLowerCase()));
BASIC_TYPES.push('undefined');

BASIC_TYPES.forEach(t => (DEFAULT_TYPE_HANDLERS[t] = NOOP_WRAPPER));
BASIC_TYPES.map(t => t.toLocaleLowerCase()).forEach(t => (DEFAULT_TYPE_HANDLERS[t] = NOOP_WRAPPER));

export abstract class MemoDriver {
    private _typeStore: CacheTypeStore;
    private pendingResults: Record<string, MemoValue> = {};

    abstract getKeys(namespace?: string): Promise<MemoKey[]>;

    constructor(protected _params: MemoDriverOptions = {}) {
        this._params.typeWrappers = this._params.typeWrappers ?? {};
    }
    /**
     * Get the name of the driver this aspect uses.
     */
    abstract get NAME(): string;

    /** Get the priority this driver should be picked up to handle the given type.
     *  Priority < 1 means this driver do nit supports the given type.
     */
    abstract getPriority(type: any): number;

    protected abstract doGetValue(key: MemoKey): any;

    protected abstract doSetValue(key: MemoKey, value: any): void;

    protected abstract doRemove(key: MemoKey): void;

    getValue(key: MemoKey): MemoValue {
        if (!isUndefined(this.pendingResults[key.toString()])) {
            return this.pendingResults[key.toString()];
        }

        const raw = this.doGetValue(key);
        if (raw === null) {
            return null;
        }

        const context = this.createDeserializationContext(key);
        const deserialized = (this._params?.serializer?.deserialize(raw, context) ?? raw) as MemoWrap;
        const value = {
            expiry: deserialized.expiry,
        } as MemoValue;

        Object.defineProperty(value, 'value', {
            get: () => this.unwrap(deserialized, context),
        });

        return value;
    }

    setValue<T>(key: MemoKey, memo: MemoValue<T>): T {
        const context = this.createSerializationContext(key);
        const serialize = this._params?.serializer?.serialize ?? (x => x);

        return _resolve(this.wrap(memo.value, context), wrapped => {
            wrapped.expiry = memo.expiry;

            if (context.async.length) {
                // promise resolution may not arrive in time in case the same method is called right after.
                // store the result in a temporaty variable in order to be available right away
                this.pendingResults[key.toString()] = memo;

                Promise.all(context.async).then(() => {
                    this.doSetValue(key, serialize(wrapped, context));
                    delete this.pendingResults[key.toString()];
                });
            } else {
                this.doSetValue(key, serialize(wrapped, context));
            }

            return memo.value;
        });
    }

    remove(key: MemoKey): void {
        this.doRemove(key);
    }

    protected wrap<T>(value: T, context: SerializationContext): MemoWrap<T> | Promise<MemoWrap<T>> {
        context.blacklist = context.blacklist ?? new Map<any, MemoWrap>();

        const typeName = value?.constructor.name ?? typeof value;
        const wrapper = this._getWrapper(typeName);

        const wrap = {
            type: typeName, // TODO remove
            date: new Date(),
            value,
        } as MemoWrap<T>;
        Reflect.setPrototypeOf(wrap, MemoWrap);

        if (isObject(value) || isArray(value)) {
            if ((value as any) === null) {
                wrap.type = 'Object';
            } else if (isObject(value)) {
                if (isPromise(value)) {
                    // consider the object as a Promise;
                    wrap.type = 'Promise';
                } else {
                    wrap.value = { ...value };
                    Reflect.setPrototypeOf(wrap.value as any, Reflect.getPrototypeOf(value));
                }
            } else if (isArray(value)) {
                wrap.value = [...(value as any[])] as any;
            }
        }
        return wrapper.wrap(wrap, value, context);
    }

    protected unwrap<T>(wrapped: MemoWrap<T>, context: DeserializationContext): T {
        context.blacklist = context.blacklist ?? new Map<MemoWrap<any>, any>();
        if (typeof wrapped === 'object') {
            Reflect.setPrototypeOf(wrapped, MemoWrap);
        }
        const typeName = wrapped.type ?? '*';
        const wrapper = this._getWrapper(typeName);

        return wrapper.unwrap(wrapped, context);
    }

    protected get typeStore(): CacheTypeStore {
        if (this._typeStore) {
            return this._typeStore;
        }

        const weaver = getWeaver();
        if (!weaver) {
            throw new WeavingError('no weaver configured. Please call setWeaver()');
        }

        const cacheableAspect = weaver.getAspect('@aspectjs/cacheable') as CacheableAspect;

        if (!cacheableAspect) {
            throw new WeavingError(
                'MemoAspect requires an aspect to be registered for id "@aspectjs/cacheable".' +
                    ' Did you forgot to call getWeaver().enable(new DefaultCacheableAspect()) ?',
            );
        }

        return (this._typeStore = cacheableAspect.cacheTypeStore);
    }

    protected createDeserializationContext(key: MemoKey): DeserializationContext {
        const context: DeserializationContext = {
            key,
            defaultUnwrap: <T>(wrapped: MemoWrap<T>) => {
                return context.blacklist.has(wrapped) ? context.blacklist.get(wrapped) : this.unwrap(wrapped, context);
            },
            typeStore: this.typeStore,
        };
        return context;
    }

    protected createSerializationContext(key: MemoKey): SerializationContext {
        const context: SerializationContext = {
            async: [],
            key,
            defaultWrap: <T>(v: T) => {
                return context.blacklist.has(v) ? context.blacklist.get(v) : this.wrap(v, context);
            },
            typeStore: this.typeStore,
        };

        return context;
    }

    protected _getWrapper(typeName: string) {
        return (
            this._params.typeWrappers[typeName] ??
            DEFAULT_TYPE_HANDLERS[typeName] ??
            this._params.typeWrappers['*'] ??
            DEFAULT_TYPE_HANDLERS['*']
        );
    }
}

function satisfies(v1: SemVer | string, v2: SemVer | string) {
    return diff(v1, v2) !== 'major';
}

function _resolve<T, U>(value: T | Promise<T>, cb: (value: T) => U): U {
    if (isPromise(value)) {
        return value.then(cb) as any;
    } else {
        return cb(value);
    }
}
