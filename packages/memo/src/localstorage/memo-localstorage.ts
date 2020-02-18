import { AnnotationFactory, Aspect, Around, on, AroundContext } from '@aspectjs/core';
import { Memo } from './memo';
import * as LZString from 'lz-string';
import * as hash from 'murmurhash';
import { stringify, parse } from 'flatted';
import { JoinPoint } from '@aspectjs/core/src/weaver/types';

const af = new AnnotationFactory('aspectjs');
export const LsMemo = af.create(function LsMemo(): MethodDecorator {
    return;
});

enum ValueType {
    DATE = 'DATE',
    OBJECT = 'OBJECT',
    PRIMITIVE = 'PRIMITIVE',
    ARRAY = 'ARRAY',
}

export interface CacheHandler {
    onRead(str: string): LsWrapper<any>;
    onWrite(obj: LsWrapper<any>): string;
}

class LsWrapper<T> {
    readonly type: ValueType;
    readonly value: T;
    readonly date: Date;
    expiry: Date;

    constructor(value: T) {
        this.value = value;
        this.date = new Date();
        this.type = _getValueType(value);
    }
}

export interface LocalStorageMemoOptions {
    localStorageImplementation?: typeof localStorage;
    handler?: CacheHandler;
    rootKey?: string;
    namespace?: string;
}

export const DEFAULTS: Required<LocalStorageMemoOptions> = {
    localStorageImplementation: undefined,
    handler: {
        onRead(str: string): LsWrapper<any> {
            const res = parse(LZString.decompressFromUTF16(str));
            Reflect.setPrototypeOf(res, LsWrapper.prototype);
            return res;
        },
        onWrite(obj: LsWrapper<any>): string {
            return LZString.compressToUTF16(stringify(obj));
        },
    },
    rootKey: '@aspectjs/lsCache',
    namespace: '',
};

@Aspect('Memo.Sync')
export class LocalStorageMemo {
    public readonly params: LocalStorageMemoOptions;
    private readonly ls: typeof localStorage;

    constructor(options: LocalStorageMemoOptions = DEFAULTS) {
        this.params = { ...DEFAULTS, ...options };

        this.ls = this.params.localStorageImplementation ?? localStorage;
        if (!this.ls) {
            throw new Error('localStorage not available on this platform, and no implementation was provided');
        }
    }

    @Around(on.method.withAnnotations(Memo))
    @Around(on.method.withAnnotations(LsMemo))
    applyMemo<T>(ctxt: AroundContext<any, any>, jp: JoinPoint): T {
        const key = _makeKey(this.params, ctxt);
        const cache = _getCache(this.params, key);

        if (cache) {
            // todo handle expiration
            return cache.value;
        } else {
            const res = jp();
            _setCache(this.params, key, res);
            return res;
        }
    }
}

function _getValueType(value: any): ValueType {
    if (value === undefined || value === null) {
        return ValueType.PRIMITIVE;
    } else if (value instanceof Array) {
        return ValueType.ARRAY;
    }
}

function _makeKey(params: LocalStorageMemoOptions, ctxt: AroundContext<any, any>) {
    const args = stringify(ctxt.args);
    return `${params.rootKey}_${params.namespace}:${ctxt.target.ref}#${hash.v3(args)}`;
}

function _getCache(params: LocalStorageMemoOptions, key: string): LsWrapper<any> | undefined {
    const stored = params.localStorageImplementation.getItem(key);

    if (stored === undefined || stored === null) {
        return stored as undefined;
    }

    return params.handler.onRead(stored);
}

function _setCache(params: LocalStorageMemoOptions, key: string, res: any) {
    const wrapper = new LsWrapper(res);
    params.localStorageImplementation.setItem(key, params.handler.onWrite(wrapper));
}
