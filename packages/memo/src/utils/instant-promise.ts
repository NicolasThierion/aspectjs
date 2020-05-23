/**
 * Like Promise.resolve, but call resolve synchronously as soon as '.then' gets called
 */
import { isPromise } from './utils';

export class InstantPromise<T> implements PromiseLike<T> {
    constructor(private readonly _value: T) {}
    then<TResult1 = T, TResult2 = never>(
        onfulfilled?: (value: T) => TResult1 | PromiseLike<TResult1>,
    ): PromiseLike<TResult1 | TResult2> {
        const res = onfulfilled(this._value);
        if (isPromise(res)) {
            return res;
        } else {
            return new InstantPromise(res as any);
        }
    }

    static resolve(value?: any) {
        return new InstantPromise(value);
    }

    static all(...promises: PromiseLike<any>[]): PromiseLike<any[]> {
        const results: any[] = [];

        let promise: PromiseLike<any[]> = new InstantPromise(results);
        promises.forEach((p, i) => {
            promise = promise.then(() => p).then(v => (results[i] = v));
        });

        return promise;
    }
}
