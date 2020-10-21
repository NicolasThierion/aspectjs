import { MemoFrame } from '../drivers';
import { MemoKey } from '../memo.types';

export interface MarshallingContext<T = unknown> extends PromiseLike<MemoFrame<T>> {
    readonly frame: MemoFrame<T>;
}

export interface UnmarshallingContext<T = unknown> {
    readonly blacklist?: Map<MemoFrame, any>;
    readonly key: MemoKey;
}
