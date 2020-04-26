import { Aspect, on, Around } from '@aspectjs/core';
import { Memo } from '../lib';
import { MemoOptions, MemoValueWrapper } from '../memo.annotation';
import { DEFAULTS as DEFAULTS_MEMO } from '../memo.aspect';
import { parse, stringify } from 'flatted';

export interface IdbMemoOptions extends MemoOptions {
    indexedDB: typeof indexedDB;
}

export const DEFAULTS: Required<IdbMemoOptions> = {
    indexedDB: undefined,
    ...DEFAULTS_MEMO,
    handler: {
        onRead(str: string): MemoValueWrapper<any> {
            if (str === null || str === undefined) {
                return null;
            }
            return parse(str);
        },
        onWrite(obj: MemoValueWrapper<any>): string {
            return stringify(obj);
        },
    },
};

@Aspect('Memo.Async')
export class IndexedDBMemoAspect {
    constructor(options: IdbMemoOptions = DEFAULTS) {}
    @Around(on.method.withAnnotations(Memo))
    memoize() {}
}
