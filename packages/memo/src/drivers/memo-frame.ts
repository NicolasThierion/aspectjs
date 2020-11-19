import { isPromise } from '@aspectjs/core/utils';

/**
 * Flat dehydrated representation of an object that can be stored easily
 * @public
 */
export interface MemoTypeInfoFrame {
    type?: string;
    instanceType?: string;
    expiration?: Date;
    version?: string;
}

/**
 * A MemoEntry once marshalled
 * @public
 */
export class MemoFrame<T = unknown> implements MemoTypeInfoFrame {
    type?: string;
    instanceType?: string;
    version?: string;
    value: T;
    hash?: string;
    async: Promise<T>;
    private _resolved: boolean;
    constructor(frame: Partial<MemoFrame<T>>) {
        Object.assign(this, frame);
    }

    setValue<X>(value: X): MemoFrame<X> {
        this._resolved = true;
        this.async = null;
        const frame = (this as any) as MemoFrame<X>;
        frame.value = value;
        return frame;
    }

    setAsyncValue<X>(value: Promise<X>): MemoFrame<X> {
        const frame = (this as any) as MemoFrame<X>;
        this._resolved = false;
        this.async = value.then((v) => {
            frame.value = v;
            this._resolved = true;
            return (frame.value as any) as T;
        });
        return frame;
    }

    isAsync() {
        return isPromise(this.async);
    }
}
