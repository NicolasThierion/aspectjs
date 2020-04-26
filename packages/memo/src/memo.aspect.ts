import { Memo, MemoOptions, MemoValueWrapper, WrappedMemoValue } from './memo.annotation';
import {
    on,
    BeforeContext,
    JoinPoint,
    Before,
    Around,
    AroundContext,
    ASPECT_OPTIONS_REFLECT_KEY,
} from '@aspectjs/core';
import { stringify } from 'flatted';
import { assert, isString, isUndefined, getMetaOrDefault, provider } from './utils';
import hash from '@emotion/hash';
import { getWeaver } from '@aspectjs/core';
import { CacheableAspect } from './cacheable-aspect';

const SALT = '@aspectjs:Memo';
const MEMO_FLAG_REFLECT_KEY = '@aspectjs:memo/isMemoized';
const MEMO_ID_REFLECT_KEY = '@aspectjs:memo/id';
let internalId = 0;

export const DEFAULTS: Required<MemoOptions> = {
    id: (ctxt: BeforeContext<any, any>) => {
        const { id, _id, hashcode, _hashcode } = ctxt.instance;
        const result = id ?? _id ?? hashcode ?? _hashcode;
        if (isUndefined(result)) {
            return getMetaOrDefault(MEMO_ID_REFLECT_KEY, ctxt.instance, () => internalId++);
        }
        return result;
    },
    namespace: '',
    handler: null,
    expiration: undefined,
};

export abstract class MemoAspect {
    private _aspectId: any;
    abstract getKeys(): string[];
    abstract doRead(key: string): any;
    abstract doWrite(key: string, res: any): void;
    abstract doRemove(key: string): void;

    constructor(protected _params: MemoOptions = DEFAULTS) {
        this._aspectId = Reflect.getOwnMetadata(
            ASPECT_OPTIONS_REFLECT_KEY,
            Reflect.getPrototypeOf(this).constructor,
        ).id;
        this._scheduleGc();

        this._params.handler = this._params.handler ?? {
            onRead: (str: string): WrappedMemoValue<any> => {
                throw new Error('no memo handler specified');
            },
            onWrite(obj: WrappedMemoValue<any>): string {
                throw new Error('no memo handler specified');
            },
        };
    }

    @Before(on.method.withAnnotations(Memo), { priority: 50 })
    generateKey(ctxt: BeforeContext<any, any>) {
        ctxt.data.key = this.createKey(ctxt);
    }

    @Around(on.method.withAnnotations(Memo), { priority: 50 })
    applyMemo<T>(ctxt: AroundContext<any, any>, jp: JoinPoint): T {
        const key = ctxt.data.key as string;
        if (!key) {
            throw new Error('memo key is not defined');
        }

        const memoWrapper = this._getMemoWrapper();

        const options = ctxt.annotation.args[0] as MemoOptions;
        const exp = this.getExpiry(ctxt, options);
        const cachedValue = this.get(key);
        Reflect.defineMetadata(MEMO_FLAG_REFLECT_KEY, true, MemoAspect, key);

        if (cachedValue) {
            if (cachedValue.date < new Date()) {
                this.remove(key);
            } else {
                return memoWrapper.unwrap(cachedValue);
            }
        } else {
            const res = jp();
            this.set(key, memoWrapper.wrap(res), exp);
            return res;
        }
    }

    private _scheduleGc() {
        this.getKeys()
            .filter(k => k.startsWith(SALT))
            .filter(k => k.endsWith('#expiration'))
            .forEach(k => {
                const exp = this.getExpiry(k);
                _scheduleCleaner(this, k, exp);
            });
    }

    getExpiry(key: string): Date | undefined;
    getExpiry(ctxt: AroundContext<any, any>, options: MemoOptions): Date | undefined;
    getExpiry(keyOrCtxt: string | AroundContext<any, any>, options?: MemoOptions): Date | undefined {
        return isString(keyOrCtxt)
            ? this._getExpiryForString(keyOrCtxt)
            : this._getExpiryFromContext(keyOrCtxt, options);
    }

    private _getExpiryFromContext(ctxt: AroundContext<any, any>, options: MemoOptions): Date | undefined {
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
    private _getExpiryForString(key: string): Date | undefined {
        const dateStr = this.doRead(key);
        assert(dateStr, `no cache entry for key "${key}"`);
        return new Date(dateStr);
    }

    protected createKey(ctxt: BeforeContext<any, any>): string {
        const argsStr = stringify(ctxt.args);
        const memoParams = ctxt.annotation.args[0] as MemoOptions;

        const namespace = provider(memoParams?.namespace)() ?? provider(this._params?.namespace)();
        const id = provider(memoParams?.id)(ctxt) ?? provider(this._params?.id)(ctxt);

        return `${SALT}_${hash(`${namespace}:${id}:${ctxt.target.ref}#${argsStr}`)}`;
    }

    get(key: string): WrappedMemoValue<any> | undefined {
        let res = this.doRead(key);
        if (res !== null && res !== undefined) {
            res = this._params.handler.onRead(res);
            Reflect.setPrototypeOf(res, WrappedMemoValue.prototype);
        }
        return res;
    }

    set(key: string, res: WrappedMemoValue<any>, expiry?: Date): void {
        this.doWrite(key, this._params.handler.onWrite(res));
        if (expiry) {
            this.doWrite(_expirationKey(key), expiry);
            _scheduleCleaner(this, key, expiry);
        }
    }

    remove(key: string): void {
        Reflect.deleteMetadata(MEMO_FLAG_REFLECT_KEY, MemoAspect, key);
        this.doRemove(_dataKey(key));
        this.doRemove(_expirationKey(key));
    }

    private _getMemoWrapper(): MemoValueWrapper {
        return getMetaOrDefault('_MemoValueWrapper', this, () => {
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
            return new MemoValueWrapper(cacheableAspect.cacheTypeStore);
        });
    }
}

function _scheduleCleaner(memo: MemoAspect, key: string, expiration: Date): void {
    const ttl = expiration.getTime() - new Date().getTime();
    if (ttl <= 0) {
        memo.remove(_dataKey(key));
    } else {
        setTimeout(() => {
            memo.remove(_dataKey(key));
        }, ttl);
    }
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
