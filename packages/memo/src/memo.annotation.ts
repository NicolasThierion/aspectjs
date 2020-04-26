import { AnnotationFactory } from '@aspectjs/core';
import { BeforeContext } from '@aspectjs/core/src/weaver/advices/before/before-context';
import { CacheTypeStore } from './cacheable-aspect';
import { assert, isArray, isNumber, isObject, isString } from './utils';
import { stringify, parse } from 'flatted';
import { Mutable } from '@aspectjs/core/src/utils';

const af = new AnnotationFactory('aspectjs');
export const Memo = af.create(function Memo(options?: MemoOptions): MethodDecorator {
    return;
});

export interface MemoOptions {
    namespace?: string | (() => string);
    expiration?: Date | number | (() => Date | number);
    handler?: MemoHandler;
    id?: string | number | ((ctxt: BeforeContext<any, any>) => string | number);
}

export interface MemoHandler {
    onRead(obj: any): WrappedMemoValue<any>;
    onWrite(obj: WrappedMemoValue<any>): any;
}

enum ValueType {
    INSTANCE = 'INSTANCE',
    DATE = 'DATE',
    OBJECT = 'OBJECT',
    PRIMITIVE = 'PRIMITIVE',
    ARRAY = 'ARRAY',
}

export class MemoValueWrapper {
    constructor(private _cacheKeyStore: CacheTypeStore) {}
    wrap<T>(
        value: T,
        blacklist: Map<any, WrappedMemoValue<any>> = new Map<any, WrappedMemoValue<any>>(),
    ): WrappedMemoValue<T> {
        const type = _getValueType(value);
        const wrapped = new WrappedMemoValue(null, type, null) as Mutable<WrappedMemoValue<any>>;

        if (type === ValueType.DATE) {
            wrapped.value = stringify(value) as any;
        } else if (isObject(value)) {
            wrapped.value = {};
            blacklist.set(value, wrapped);

            if (type === ValueType.INSTANCE) {
                const proto = Reflect.getPrototypeOf(value);
                wrapped.objectTypeKey = this._cacheKeyStore.getTypeKey(proto);
                Reflect.setPrototypeOf(wrapped.value, proto);
            }
            wrapped.value = ([] as (string | symbol)[])
                .concat(Object.getOwnPropertyNames(value))
                .concat(Object.getOwnPropertySymbols(value))
                .reduce((w, k) => {
                    const v = (value as any)[k];
                    w[k] = blacklist.has(v) ? blacklist.get(v) : this.wrap(v, blacklist);
                    return w;
                }, wrapped.value);
        } else if (isArray(value)) {
            assert(type === ValueType.ARRAY);
            wrapped.value = [];
            blacklist.set(value, wrapped);
            (wrapped.value as any[]).push(
                ...(value as any[]).map(v => {
                    if (blacklist.has(v)) {
                        return blacklist.get(v);
                    }
                    return this.wrap(v, blacklist);
                }),
            );
        } else if (type === ValueType.PRIMITIVE) {
            // nothing to do so far;
            wrapped.value = value;
        } else {
            assert(false, `unrecognized type: ${type}`);
        }

        return wrapped;
    }
    unwrap<T>(
        wrapped: WrappedMemoValue<T>,
        blacklist: Map<WrappedMemoValue<any>, any> = new Map<WrappedMemoValue<any>, any>(),
    ): T {
        let value: any = wrapped.value;
        if (wrapped.type === ValueType.PRIMITIVE) {
            // nothing to do so far
            value = wrapped.value;
        } else if (isObject(wrapped.value)) {
            value = {};
            blacklist.set(wrapped, value);

            value = ([] as (string | symbol)[])
                .concat(Object.getOwnPropertyNames(wrapped.value))
                .concat(Object.getOwnPropertySymbols(wrapped.value))
                .reduce((v, k) => {
                    const w = (wrapped.value as any)[k];
                    v[k] = blacklist.has(w) ? blacklist.get(w) : this.unwrap(w, blacklist);
                    return v;
                }, value);
            if (wrapped.type === ValueType.INSTANCE) {
                assert(!!wrapped.objectTypeKey);
                const proto = this._cacheKeyStore.getPrototype(wrapped.objectTypeKey);
                Reflect.setPrototypeOf(value, proto);
            }
        } else if (isArray(wrapped.value)) {
            assert(wrapped.type === ValueType.ARRAY);
            value = [];

            blacklist.set(wrapped, value);
            value.push(
                ...(wrapped.value as any[]).map(w => {
                    if (blacklist.has(w)) {
                        return blacklist.get(w);
                    }
                    return this.unwrap(w, blacklist);
                }),
            );
        } else if (wrapped.type === ValueType.DATE) {
            assert(isString(wrapped.value));
            value = new Date(parse(wrapped.value as any));
        } else {
            assert(false, `unrecognized type: ${wrapped.type}`);
        }

        return value;
    }
}

export class WrappedMemoValue<T> {
    constructor(
        public readonly value: T,
        public readonly type: string,
        public readonly objectTypeKey?: string,
        public readonly date = new Date(),
    ) {}
}

function _getValueType(value: any): ValueType {
    if (value === undefined || value === null || isString(value) || isNumber(value) || typeof value === 'boolean') {
        return ValueType.PRIMITIVE;
    } else if (isArray(value)) {
        return ValueType.ARRAY;
    } else if (value instanceof Date) {
        return ValueType.DATE;
    } else if (isObject(value)) {
        return value.constructor === Object.prototype.constructor ? ValueType.OBJECT : ValueType.INSTANCE;
    } else {
        throw new TypeError(`unsupported value type: ${value?.prototype?.constructor ?? typeof value}`);
    }
}
