export interface MemoMetaFrame {
    type?: string;
    instanceType?: string;
    expiration?: Date;
    version?: string;
}

/**
 * A MemoEntry once marshalled
 */

export class MemoFrame<T = unknown> implements MemoMetaFrame {
    type?: string;
    instanceType?: string;
    expiration?: Date;
    version?: string;
    value: T;
    private _resolved: boolean;
    public async: Promise<T>;

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
}
