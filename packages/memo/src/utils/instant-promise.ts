/**
 * Like Promise.resolve, but call resolve synchronously as soon as '.then' gets called
 */
import { isPromise } from '@aspectjs/core/utils';

export class InstantPromise<T> implements PromiseLike<T> {
    private _resolved: boolean;
    private _value?: T;
    private _rejectValue?: any;
    private _onfulfilled: ((r: any) => InstantPromise<unknown>)[] = [];
    private _onrejected: ((r: any) => InstantPromise<unknown>)[] = [];

    constructor() {}

    static resolve<T>(value?: T) {
        return new InstantPromise<T>().resolve(value);
    }

    static all(...promises: PromiseLike<any>[]): PromiseLike<any[]> {
        const results: any[] = [];

        let promise: PromiseLike<any[]> = new InstantPromise<any[]>().resolve(results);
        promises.forEach((p, i) => {
            promise = promise.then(() => p).then((v) => (results[i] = v));
        });

        return promise;
    }

    then<TResult1 = T, TResult2 = never>(
        onfulfilled?: (value: T) => TResult1 | PromiseLike<TResult1>,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
    ): PromiseLike<TResult1 | TResult2> {
        if (this._resolved) {
            const res = onfulfilled(this._value);
            if (isPromise(res)) {
                return res;
            } else {
                return new InstantPromise<any>().resolve(res);
            }
        } else {
            const delegate = new InstantPromise<TResult1>();
            this._onfulfilled.push((r: any) => delegate.resolve(onfulfilled ? (onfulfilled(r) as any) : undefined));
            this._onrejected.push((r: any) => delegate.resolve(onrejected ? (onrejected(r) as any) : undefined));
            return delegate;
        }
    }

    resolve(value: T): this {
        if (this._resolved) {
            throw new Error('promise already resolved');
        }
        this._resolved = true;
        this._value = value;
        if (this._onfulfilled) {
            this._onfulfilled.forEach((f) => f(value));
        }

        return this;
    }

    reject(rejectValue: any): this {
        if (this._resolved) {
            throw new Error('promise already resolved');
        }
        this._resolved = true;
        this._rejectValue = rejectValue;
        if (this._onrejected) {
            this._onrejected.forEach((f) => f(rejectValue));
        }

        return this;
    }
}
