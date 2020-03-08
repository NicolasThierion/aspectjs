import { AnnotationFactory, Around, AroundContext, Aspect, on } from '@aspectjs/core';
import { Memo, MemoOptions } from '../memo';
import hash from '@emotion/hash';
import { parse, stringify } from 'flatted';
import { JoinPoint } from '@aspectjs/core/src/weaver/types';
import { provider } from '../utils';

const af = new AnnotationFactory('aspectjs');
export const LsMemo = af.create(function LsMemo(options: MemoOptions): MethodDecorator {
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

export interface LsMemoOptions extends MemoOptions {
    localStorage?: typeof localStorage;
    handler?: CacheHandler;
    salt?: string;
    hashcode?: string | number | ((ctxt: AroundContext<any, any>) => string | number);
    namespace?: string | (() => string);
}

export const DEFAULTS: Required<LsMemoOptions> = {
    localStorage: undefined,
    handler: {
        onRead(str: string): LsWrapper<any> {
            return parse(str);
        },
        onWrite(obj: LsWrapper<any>): string {
            return stringify(obj);
        },
    },
    salt: '@aspectjs/lsCache',
    hashcode: (ctxt: AroundContext<any, any>) => {
        try {
            const { id, _id, hashcode, _hashcode } = ctxt.instance;
            return id ?? _id ?? hashcode ?? _hashcode;
        } catch (e) {
            console.error(e.message);
            return null;
        }
    },
    namespace: '',
    expiration: undefined,
};

@Aspect('Memo.Sync')
export class LsMemoAspect {
    public readonly params: LsMemoOptions;
    private readonly ls: typeof localStorage;

    constructor(options: LsMemoOptions = DEFAULTS) {
        this.params = { ...DEFAULTS, ...options };

        this.ls = this.params.localStorage ?? localStorage;
        if (!this.ls) {
            throw new Error('localStorage not available on this platform, and no implementation was provided');
        }

        this._scheduleGc();
    }

    @Around(on.method.withAnnotations(Memo))
    applyMemo<T>(ctxt: AroundContext<any, any>, jp: JoinPoint): T {
        // TODO handle async passthrough
        return this.applyLsMemo(ctxt, jp);
    }

    @Around(on.method.withAnnotations(LsMemo))
    applyLsMemo<T>(ctxt: AroundContext<any, any>, jp: JoinPoint): T {
        const options = ctxt.annotation.args[0] as MemoOptions;
        const exp = _getExpirationDate(ctxt, options);
        const key = _makeKey(this.params, ctxt);
        const cache = _getCache(this.params, key);

        if (cache) {
            // todo handle expiration
            return cache.value;
        } else {
            const res = jp();
            _setCache(this.params, key, exp, res);
            return res;
        }
    }

    private _scheduleGc() {
        _lsKeys(this.ls)
            .filter(k => k.startsWith(this.params.salt))
            .filter(k => k.endsWith('#expiration'))
            .forEach(k => {
                const exp = _getExpiration(this.params, k);
                _scheduleCleaner(this.params, k, exp);
            });
    }
}

function _getValueType(value: any): ValueType {
    if (value === undefined || value === null) {
        return ValueType.PRIMITIVE;
    } else if (value instanceof Array) {
        return ValueType.ARRAY;
    }
}

function _makeKey(params: LsMemoOptions, ctxt: AroundContext<any, any>): string {
    const argsStr = stringify(ctxt.args);
    const memoParams = ctxt.annotation.args[0] as MemoOptions;
    return `${params.salt}_${hash(
        `${provider(memoParams?.namespace)() ?? provider(params.namespace)()}:${provider(params.hashcode)(ctxt)}:${
            ctxt.target.ref
        }#${argsStr}`,
    )}`;
}

function _dataKey(key: string): string {
    return key.replace(/#expiration$/, '');
}

function _expirationKey(key: string): string {
    if (key.endsWith('#expiration')) {
        return key;
    }
    return key.concat('#expiration');
}

function _getCache(params: LsMemoOptions, key: string): LsWrapper<any> | undefined {
    const stored = params.localStorage.getItem(key);

    if (stored === undefined || stored === null) {
        return stored as undefined;
    }

    const res = params.handler.onRead(stored);
    Reflect.setPrototypeOf(res, LsWrapper.prototype);

    return res;
}

function _setCache(params: LsMemoOptions, key: string, expiration: Date, res: any) {
    const wrapper = new LsWrapper(res);
    params.localStorage.setItem(key, params.handler.onWrite(wrapper));

    if (expiration) {
        _setExpiration(params, key, expiration);
    }
}

function _clearCache(params: LsMemoOptions, key: string) {
    params.localStorage.removeItem(_dataKey(key));
    params.localStorage.removeItem(_expirationKey(key));
}

function _setExpiration(params: LsMemoOptions, key: string, expiration: Date) {
    params.localStorage.setItem(_expirationKey(key), stringify(expiration));
    _scheduleCleaner(params, key, expiration);
}

function _scheduleCleaner(params: LsMemoOptions, key: string, expiration: Date) {
    const ttl = expiration.getTime() - new Date().getTime();
    if (ttl <= 0) {
        _clearCache(params, key);
    } else {
        setTimeout(() => {
            _clearCache(params, key);
        }, ttl);
    }
}

function _getExpiration(params: LsMemoOptions, key: string): Date | undefined {
    return new Date(parse(params.localStorage.getItem(_expirationKey(key))));
}

function _getExpirationDate(ctxt: AroundContext<any, any>, options: MemoOptions): Date | undefined {
    const exp = provider(options?.expiration)();
    if (exp) {
        if (exp instanceof Date) {
            return exp;
        } else if (typeof exp === 'number' && exp > 0) {
            return new Date(new Date().getTime() + exp * 1000);
        } else if (exp === 0) {
            return;
        }

        throw new TypeError(`${ctxt.target}: expiration should be either a Date or a positive number. Got: ${exp}`);
    }
}

function _lsKeys(ls: typeof localStorage): string[] {
    const res: string[] = [];
    for (let i = 0; i < ls.length; ++i) {
        res.push(ls.key(i));
    }
    return res;
}
