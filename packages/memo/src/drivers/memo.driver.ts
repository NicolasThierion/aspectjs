import { assert, isArray, isNumber, isObject, isString, provider } from '../utils';
import { CacheableAspect, CacheTypeStore } from '../cacheable/cacheable.aspect';
import { getWeaver } from '@aspectjs/core';
import { parse, stringify } from 'flatted';
import { diff, valid } from 'semver';
import { VersionConflictError } from '../errors';
import SemVer from 'semver/classes/semver';
import { DeserializationContext, MemoKey, MemoSerializer, MemoValue, SerializationContext } from '../memo.types';
import { MemoWrap, MemoWrapField, MemoWrapper } from './memo-wrap';

enum ValueType {
    CACHEABLE_INSTANCE = 'CACHEABLE_INSTANCE',
    DATE = 'DATE',
    OBJECT = 'OBJECT',
    PRIMITIVE = 'PRIMITIVE',
    ARRAY = 'ARRAY',
    PROMISE = 'PROMISE',
}

export interface MemoDriverOptions {
    serializer?: MemoSerializer;
    typeWrappers?: {
        '*'?: MemoWrapper; // default type handler
        [typeName: string]: MemoWrapper;
    };
}

export const DEFAULT_TYPE_HANDLERS: MemoDriverOptions['typeWrappers'] = {};

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
            get: () => this._deserialize(deserialized, context),
        });
        return value;
    }
    serialize(obj: MemoValue, context: SerializationContext): any {
        const serialized = this._serialize(obj.value, context);
        serialized[MemoWrapField.EXPIRY] = obj.expiry;
        return this._params?.serializer?.serialize(serialized, context) ?? serialized;
    }

    private _serialize<T>(value: T, context: SerializationContext): MemoWrap<T> {
        context.blacklist = context.blacklist ?? new Map<any, MemoWrap>();
        const blacklist = context.blacklist;
        const type = _getValueType(value);
        const wrap = {} as MemoWrap;
        const F = MemoWrapField;
        wrap[F.TYPE] = type;

        if (type === ValueType.PRIMITIVE) {
            // nothing to do so far;
            wrap[F.VALUE] = value;
        } else if (type === ValueType.DATE) {
            wrap[F.VALUE] = stringify(value) as any;
        } else if (isObject(value)) {
            wrap[F.VALUE] = {};
            blacklist.set(value, wrap);

            if (type === ValueType.CACHEABLE_INSTANCE) {
                const proto = Reflect.getPrototypeOf(value);
                wrap[F.INSTANCE_TYPE] = this.typeStore.getTypeKey(proto);
                wrap[F.VERSION] = provider(this.typeStore.getVersion(wrap[F.INSTANCE_TYPE]))();
                Reflect.setPrototypeOf(wrap[F.VALUE], proto);
            }
            wrap[F.VALUE] = ([] as (string | symbol)[])
                .concat(Object.getOwnPropertyNames(value))
                .concat(Object.getOwnPropertySymbols(value))
                .reduce((w, k) => {
                    const v = (value as any)[k];
                    w[k] = blacklist.has(v) ? blacklist.get(v) : this._serialize(v, context);
                    return w;
                }, wrap[F.VALUE]);
        } else if (isArray(value)) {
            assert(type === ValueType.ARRAY);
            wrap[F.VALUE] = [];
            blacklist.set(value, wrap);
            (wrap[F.VALUE] as any[]).push(
                ...(value as any[]).map(v => {
                    if (blacklist.has(v)) {
                        return blacklist.get(v);
                    }
                    return this._serialize(v, context);
                }),
            );
        } else {
            assert(false, `unrecognized type: ${wrap[F.TYPE]}`);
        }

        return wrap;
    }

    private _deserialize<T>(wrapped: MemoWrap<T>, context: DeserializationContext): T {
        const F = MemoWrapField;
        let value: any = wrapped[F.VALUE];

        context.blacklist = context.blacklist ?? new Map<MemoWrap<any>, any>();
        const blacklist = context.blacklist;
        if (wrapped[F.TYPE] === ValueType.PRIMITIVE) {
            // nothing to do so far
            value = wrapped[F.VALUE];
        } else if (isObject(wrapped[F.VALUE])) {
            value = {};
            blacklist.set(wrapped, value);

            value = ([] as (string | symbol)[])
                .concat(Object.getOwnPropertyNames(wrapped[F.VALUE]))
                .concat(Object.getOwnPropertySymbols(wrapped[F.VALUE]))
                .reduce((v, k) => {
                    const w = (wrapped[F.VALUE] as any)[k];
                    v[k] = blacklist.has(w) ? blacklist.get(w) : this._deserialize(w, context);
                    return v;
                }, value);
            if (wrapped[F.TYPE] === ValueType.CACHEABLE_INSTANCE) {
                assert(!!wrapped[F.INSTANCE_TYPE]);
                const proto = this.typeStore.getPrototype(wrapped[F.INSTANCE_TYPE]);
                const version = provider(this.typeStore.getVersion(wrapped[F.INSTANCE_TYPE]))();
                if (version !== wrapped[F.VERSION]) {
                    if (!(valid(version) && valid(wrapped[F.VERSION]) && satisfies(version, wrapped[F.VERSION]))) {
                        throw new VersionConflictError(
                            `Object for key ${
                                wrapped[F.INSTANCE_TYPE]
                            } is of version ${version}, but incompatible version ${
                                wrapped[F.VERSION]
                            } was already cached`,
                            context,
                        );
                    }
                }

                Reflect.setPrototypeOf(value, proto);
            }
        } else if (isArray(wrapped[F.VALUE])) {
            assert(wrapped[F.TYPE] === ValueType.ARRAY);
            value = [];

            blacklist.set(wrapped, value);
            value.push(
                ...(wrapped[F.VALUE] as any[]).map(w => {
                    if (blacklist.has(w)) {
                        return blacklist.get(w);
                    }
                    return this._deserialize(w, context);
                }),
            );
        } else if (wrapped[F.TYPE] === ValueType.DATE) {
            assert(isString(wrapped[F.VALUE]));
            value = new Date(parse(wrapped[F.VALUE] as any));
        } else {
            assert(false, `unrecognized type: ${wrapped[F.TYPE]}`);
        }

        return value;
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
}

function _getValueType(value: any): ValueType {
    if (value === undefined || value === null || isString(value) || isNumber(value) || typeof value === 'boolean') {
        return ValueType.PRIMITIVE;
    } else if (isArray(value)) {
        return ValueType.ARRAY;
    } else if (value instanceof Date) {
        return ValueType.DATE;
    } else if (isObject(value)) {
        return value.constructor === Object.prototype.constructor ? ValueType.OBJECT : ValueType.CACHEABLE_INSTANCE;
    } else {
        throw new TypeError(`unsupported value type: ${value?.prototype?.constructor ?? typeof value}`);
    }
}

function satisfies(v1: SemVer | string, v2: SemVer | string) {
    return diff(v1, v2) !== 'major';
}
