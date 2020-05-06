import { assert, isArray, isObject, provider } from '../utils';
import { CacheableAspect, CacheTypeStore } from '../cacheable/cacheable.aspect';
import { getWeaver } from '@aspectjs/core';
import { parse, stringify } from 'flatted';
import { diff, valid } from 'semver';
import { VersionConflictError } from '../errors';
import SemVer from 'semver/classes/semver';
import { DeserializationContext, MemoKey, MemoSerializer, MemoValue, SerializationContext } from '../memo.types';
import { MemoWrap, MemoWrapField, MemoWrapper } from './memo-wrap';

export interface MemoDriverOptions {
    serializer?: MemoSerializer;
    typeWrappers?: {
        '*'?: MemoWrapper; // default type handler
        [typeName: string]: MemoWrapper;
    };
}

export const NOOP_WRAPPER: MemoWrapper = {
    unwrap<T>(wrap: MemoWrap<T>): T {
        return wrap[MemoWrapField.VALUE];
    },
    wrap<T>(wrap: MemoWrap<T>): MemoWrap<T> {
        return wrap;
    },
};

export const DEFAULT_TYPE_HANDLERS: MemoDriverOptions['typeWrappers'] = {
    Object: {
        unwrap(wrap: MemoWrap<object>, context: DeserializationContext): object {
            if (wrap[MemoWrapField.VALUE] === null) {
                return null;
            }
            let value = {};
            context.blacklist.set(wrap, value);

            const F = MemoWrapField;

            value = ([] as (string | symbol)[])
                .concat(Object.getOwnPropertyNames(wrap[F.VALUE]))
                .concat(Object.getOwnPropertySymbols(wrap[F.VALUE]))
                .reduce((v, k) => {
                    const w = (wrap[F.VALUE] as any)[k];
                    v[k] = context.blacklist.has(w) ? context.blacklist.get(w) : context.defaultUnwrap(w, context);
                    return v;
                }, value as any);

            return value;
        },

        wrap(wrap: MemoWrap<object>, value: object, context: SerializationContext): MemoWrap<object> {
            if (value === null) {
                return wrap;
            }
            const F = MemoWrapField;
            context.blacklist.set(value, wrap);

            wrap[F.VALUE] = ([] as (string | symbol)[])
                .concat(Object.getOwnPropertyNames(value))
                .concat(Object.getOwnPropertySymbols(value))
                .reduce((w, k) => {
                    const v = (value as any)[k];
                    w[k] = context.blacklist.has(v) ? context.blacklist.get(v) : context.defaultWrap(v, context);
                    return w;
                }, wrap[F.VALUE] as any);

            return wrap;
        },
    },
    Array: {
        unwrap(wrap: MemoWrap<unknown[]>, context: DeserializationContext): unknown[] {
            // assert(wrapped[F.TYPE] === ValueType.ARRAY);
            const value = [] as any[];

            context.blacklist.set(wrap, value);
            value.push(
                ...((wrap[MemoWrapField.VALUE] as any) as any[]).map(w => {
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
            wrap[MemoWrapField.VALUE] = [];
            context.blacklist.set(value, wrap);
            (wrap[MemoWrapField.VALUE] as any[]).push(
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
            wrap[MemoWrapField.VALUE] = stringify(value) as any;
            return wrap;
        },
        unwrap(wrap: MemoWrap<Date>): Date {
            return new Date(parse(wrap[MemoWrapField.VALUE] as any));
        },
    },
    '*': {
        wrap(wrap: MemoWrap<object>, value: any, context: SerializationContext): MemoWrap<any> {
            // delete wrap[MemoWrapField.TYPE]; // Do not store useless type, as INSTANCE_TYPE is used for objects of non-built-in types.
            const proto = Reflect.getPrototypeOf(value);
            wrap = DEFAULT_TYPE_HANDLERS.Object.wrap(wrap, value, context);
            const type = context.typeStore.getTypeKey(proto);
            wrap[MemoWrapField.INSTANCE_TYPE] = type;
            wrap[MemoWrapField.VERSION] = provider(context.typeStore.getVersion(type))();
            // Reflect.setPrototypeOf(wrap[F.VALUE], proto);
            return wrap;
        },
        unwrap(wrap: MemoWrap<any>, context: DeserializationContext): any {
            const F = MemoWrapField;
            const value = DEFAULT_TYPE_HANDLERS.Object.unwrap(wrap, context);

            assert(!!wrap[F.INSTANCE_TYPE]);
            const proto = context.typeStore.getPrototype(wrap[F.INSTANCE_TYPE]);
            const version = provider(context.typeStore.getVersion(wrap[F.INSTANCE_TYPE]))();
            if (version !== wrap[F.VERSION]) {
                if (!(valid(version) && valid(wrap[F.VERSION]) && satisfies(version, wrap[F.VERSION]))) {
                    throw new VersionConflictError(
                        `Object for key ${wrap[F.INSTANCE_TYPE]} is of version ${version}, but incompatible version ${
                            wrap[F.VERSION]
                        } was already cached`,
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

    abstract accept(type: any): boolean;

    protected abstract doGetValue(key: MemoKey): MemoValue;

    protected abstract doSetValue(key: MemoKey, memo: MemoValue): void;

    protected abstract doRemove(key: MemoKey): void;

    getValue(key: MemoKey): MemoValue {
        return this.doGetValue(key);
    }

    setValue(key: MemoKey, memo: MemoValue): void {
        this.doSetValue(key, memo);
    }

    remove(key: MemoKey): void {
        this.doRemove(key);
    }

    deserialize(rawValue: any, context: DeserializationContext): MemoValue {
        const deserialized = (this._params?.serializer?.deserialize(rawValue, context) ?? rawValue) as MemoWrap;
        const value = {
            expiry: deserialized[MemoWrapField.EXPIRY],
        } as MemoValue;

        Object.defineProperty(value, 'value', {
            get: () => this.unwrap(deserialized, context),
        });
        return value;
    }
    serialize(obj: MemoValue, context: SerializationContext): any {
        const wrapped = this.wrap(obj.value, context);
        wrapped[MemoWrapField.EXPIRY] = obj.expiry;
        return this._params?.serializer?.serialize(wrapped, context) ?? wrapped;
    }

    protected wrap<T>(value: T, context: SerializationContext): MemoWrap<T> {
        context.blacklist = context.blacklist ?? new Map<any, MemoWrap>();

        const typeName = value?.constructor.name ?? typeof value;
        const wrapper =
            this._params.typeWrappers[typeName] ?? this._params.typeWrappers['*'] ?? DEFAULT_TYPE_HANDLERS['*'];

        const wrap = {
            [MemoWrapField.TYPE]: typeName, // TODO remove
            [MemoWrapField.DATE]: new Date(),
            [MemoWrapField.VALUE]: value,
        } as MemoWrap<T>;

        if (isObject(value) || isArray(value)) {
            if ((value as any) === null) {
                wrap[MemoWrapField.TYPE] = 'Object';
            } else if (isObject(value)) {
                wrap[MemoWrapField.VALUE] = { ...value };
                Reflect.setPrototypeOf([MemoWrapField.VALUE], Reflect.getPrototypeOf(value));
            } else if (isArray(value)) {
                wrap[MemoWrapField.VALUE] = [...(value as any[])] as any;
            }
        }
        return wrapper.wrap(wrap, value, context);
    }

    protected unwrap<T>(wrapped: MemoWrap<T>, context: DeserializationContext): T {
        context.blacklist = context.blacklist ?? new Map<MemoWrap<any>, any>();

        const typeName = wrapped[MemoWrapField.TYPE] ?? '*';
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
