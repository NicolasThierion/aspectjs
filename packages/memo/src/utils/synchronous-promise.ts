import { isPromise } from './utils';

export class SynchronousPromise<T = any> implements PromiseLike<T> {
    private _resolved: boolean;
    private _errorHandler?: (error: any) => any;
    constructor(private _value: T, private _promise?: Promise<T>, private _error?: any) {
        if (this._promise) {
            this._resolved = false;
            this._promise.then(r => {
                this._resolved = true;
                this._value = r;
                return r;
            });
        } else {
            this._resolved = true;
        }
    }
    get(): T {
        if (this._error) {
            throw this._error;
        }
        return this._value;
    }
    then<R, E>(
        onfulfilled?: ((value: T) => R | PromiseLike<R>) | undefined | null,
        onrejected?: ((reason: any) => E | PromiseLike<E>) | undefined | null,
    ): SynchronousPromise<R | E> {
        let promise: SynchronousPromise<R | E>;
        if (this._promise) {
            if (this._error) {
                promise = new SynchronousPromise<R | E>(
                    null,
                    this._promise.then(() => Promise.reject(this._error)).then(() => {}, onrejected) as Promise<any>,
                    this._error,
                );
            } else {
                promise = new SynchronousPromise<R | E>(null, this._promise.then(onfulfilled, onrejected));
            }
        } else {
            try {
                if (this._error) {
                    if (onrejected) {
                        promise = new SynchronousPromise<E>(onrejected(this._error) as E);
                    } else {
                        promise = new SynchronousPromise<E>(null, null, this._error);
                    }
                } else {
                    const res = onfulfilled(this._value);
                    if (isPromise(res)) {
                        promise = new SynchronousPromise<R>((res as any) as R, res);
                    } else {
                        promise = new SynchronousPromise<R>(res as R);
                    }
                }
            } catch (e) {
                if (onrejected) {
                    promise = new SynchronousPromise<E>(onrejected(e) as E);
                } else {
                    this._error = e;
                    promise = new SynchronousPromise<E>(null, null, e);
                }
            }
        }
        return promise;
    }
}
