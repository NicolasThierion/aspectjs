import { Around, Aspect, on } from '@aspectjs/core';
import { Memo, WrappedMemoValue } from '../lib';
import { MemoOptions } from '../memo.annotation';
import { DEFAULT_MEMO_OPTIONS } from '../memo.aspect';
import { parse, stringify } from 'flatted';

export interface IndexedDbMemoOptions extends MemoOptions {
    indexedDB: typeof indexedDB;
}

export const DEFAULT_IDB_MEMO_OPTIONS: Required<IndexedDbMemoOptions> = {
    indexedDB: undefined,
    ...DEFAULT_MEMO_OPTIONS,
    handler: {
        onRead(str: string): WrappedMemoValue<any> {
            if (str === null || str === undefined) {
                return null;
            }
            return parse(str);
        },
        onWrite(obj: WrappedMemoValue<any>): string {
            return stringify(obj);
        },
    },
};

@Aspect('Memo.Async')
export class IndexedDbMemoAspect {
    constructor(options: IndexedDbMemoOptions = DEFAULT_IDB_MEMO_OPTIONS) {}
    @Around(on.method.withAnnotations(Memo))
    memoize() {}
}
