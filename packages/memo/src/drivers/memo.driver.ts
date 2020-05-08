import { assert, isArray, isObject, isPromise, provider } from '../utils';
import { CacheableAspect, CacheTypeStore } from '../cacheable/cacheable.aspect';
import { getWeaver } from '@aspectjs/core';
import { parse, stringify } from 'flatted';
import { diff, valid } from 'semver';
import { VersionConflictError } from '../errors';
import SemVer from 'semver/classes/semver';
import { DeserializationContext, MemoKey, MemoSerializer, MemoValue, SerializationContext } from '../memo.types';
import { MemoWrap, MemoWrapper } from './memo-wrap';

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
                    const w = (wrap.value as any)[k];
                    v[k] = context.blacklist.has(w) ? context.blacklist.get(w) : context.defaultUnwrap(w, context);
                    return v;
                }, value as any);

            return value;
        },

        wrap(wrap: MemoWrap<object>, value: object, context: SerializationContext): MemoWrap<object> {
            if (value === null) {
                return wrap;
            }
            context.blacklist.set(value, wrap);

            wrap.value = ([] as (string | symbol)[])
                .concat(Object.getOwnPropertyNames(value))
                .concat(Object.getOwnPropertySymbols(value))
                .reduce((w, k) => {
                    const v = (value as any)[k];
                    w[k] = context.blacklist.has(v) ? context.blacklist.get(v) : context.defaultWrap(v, context);
                    return w;
                }, wrap.value as any);

            return wrap;
        },
    },
    Array: {
        unwrap(wrap: MemoWrap<unknown[]>, context: DeserializationContext): unknown[] {
            // assert(wrapped[F.TYPE] === ValueType.ARRAY);
            const value = [] as any[];

            context.blacklist.set(wrap, value);
            value.push(
                ...((wrap.value as any) as any[]).map(w => {
                    if (context.blacklist.has(w)) {
                        return context.blacklist.get(w);
                    }
                    return context.defaultUnwrap(w, context);
                }),
            );
            return value;
        },
        wrap(wrap: MemoWrap<unknown[]>, value: unknown[], context: SerializationContext): MemoWrap<any[]> {
            // assert(type === ValueType.ARRAY);
            wrap.value = [];
            context.blacklist.set(value, wrap);
            (wrap.value as any[]).push(
                ...(value as any[]).map(v => {
                    if (context.blacklist.has(v)) {
                        return context.blacklist.get(v);
                    }
                    return context.defaultWrap(v, context);
                }),
            );

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
    '*': {
        wrap(wrap: MemoWrap<object>, value: any, context: SerializationContext): MemoWrap<any> {
            // delete wrap.type; // Do not store useless type, as INSTANCE_TYPE is used for objects of non-built-in types.
            const proto = Reflect.getPrototypeOf(value);
            wrap = DEFAULT_TYPE_HANDLERS.Object.wrap(wrap, value, context);
            const type = context.typeStore.getTypeKey(proto);
            wrap.instanceType = type;
            wrap.version = provider(context.typeStore.getVersion(type))();
            // Reflect.setPrototypeOf(wrap.value, proto);
            return wrap;
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
const BASIC_TYPES = ['Number', 'String', 'Boolean', 'Symbol', 'Promise'];
BASIC_TYPES.push(...BASIC_TYPES.map(t => t.toLowerCase()));
BASIC_TYPES.push('undefined');

BASIC_TYPES.forEach(t => (DEFAULT_TYPE_HANDLERS[t] = NOOP_WRAPPER));
BASIC_TYPES.map(t => t.toLocaleLowerCase()).forEach(t => (DEFAULT_TYPE_HANDLERS[t] = NOOP_WRAPPER));
Object.freeze(DEFAULT_TYPE_HANDLERS);

export abstract class MemoDriver {
    private _typeStore: CacheTypeStore;

    abstract getKeys(namespace?: string): Promise<MemoKey[]>;

    constructor(protected _params: MemoDriverOptions = {}) {
        this._params.typeWrappers = { ...DEFAULT_TYPE_HANDLERS, ...this._params.typeWrappers };
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
        const raw = this.doGetValue(key);
        if (raw === null) {
            return null;
        }

        const context = this.createDeserializationContext(key);
        const deserialized = (this._params?.serializer?.deserialize(raw, context) ?? raw) as MemoWrap;
        const value = {
            expiry: deserialized.expiry,
        } as MemoValue;

        if (deserialized.type === 'Promise') {
            Object.defineProperty(value, 'value', {
                get: () => Promise.resolve(this.unwrap(deserialized, context)),
            });
        } else {
            Object.defineProperty(value, 'value', {
                get: () => this.unwrap(deserialized, context),
            });
        }

        return value;
    }

    setValue(key: MemoKey, memo: MemoValue): void {
        const context = this.createSerializationContext(key);
        const wrapped = this.wrap(memo.value, context);
        wrapped.expiry = memo.expiry;
        const serialize = this._params?.serializer?.serialize ?? (x => x);

        if (isPromise(wrapped.value)) {
            wrapped.value.then(v => {
                wrapped.value = v;
                this.doSetValue(key, serialize(wrapped, context));
            });
        } else {
            this.doSetValue(key, serialize(wrapped, context));
        }
    }

    remove(key: MemoKey): void {
        this.doRemove(key);
    }

    protected wrap<T>(value: T, context: SerializationContext): MemoWrap<T> {
        context.blacklist = context.blacklist ?? new Map<any, MemoWrap>();

        const typeName = value?.constructor.name ?? typeof value;
        const wrapper =
            this._params.typeWrappers[typeName] ?? this._params.typeWrappers['*'] ?? DEFAULT_TYPE_HANDLERS['*'];

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
                Reflect.setPrototypeOf(wrap.value as any, Reflect.getPrototypeOf(value));
            } else if (isArray(value)) {
                wrap.value = [...(value as any[])] as any;
            }
        }
        return wrapper.wrap(wrap, value, context);
    }

    protected unwrap<T>(wrapped: MemoWrap<T>, context: DeserializationContext): T {
        context.blacklist = context.blacklist ?? new Map<MemoWrap<any>, any>();
        Reflect.setPrototypeOf(wrapped, MemoWrap);
        const typeName = wrapped.type ?? '*';
        const wrapper =
            this._params.typeWrappers[typeName] ?? this._params.typeWrappers['*'] ?? DEFAULT_TYPE_HANDLERS['*'];

        return wrapper.unwrap(wrapped, context);
    }

    protected get typeStore(): CacheTypeStore {
        if (this._typeStore) {
            return this._typeStore;
        }

        const weaver = getWeaver();
        if (!weaver) {
            throw new Error('no weaver configured. Please call setWeaver()');
        }

        const cacheableAspect = weaver.getAspect('@aspectjs/cacheable') as CacheableAspect;

        if (!cacheableAspect) {
            throw new Error(
                'MemoAspect requires an aspect to be registered for id "@aspectjs/cacheable".' +
                    ' Did you forgot to call getWeaver().enable(new DefaultCacheableAspect()) ?',
            );
        }

        return (this._typeStore = cacheableAspect.cacheTypeStore);
    }

    protected createDeserializationContext(key: MemoKey): DeserializationContext {
        return {
            key,
            defaultUnwrap: this.unwrap.bind(this),
            typeStore: this.typeStore,
        };
    }

    protected createSerializationContext(key: MemoKey): SerializationContext {
        return {
            key,
            defaultWrap: this.wrap.bind(this),
            typeStore: this.typeStore,
        };
    }
}

function satisfies(v1: SemVer | string, v2: SemVer | string) {
    return diff(v1, v2) !== 'major';
}
