import { Memo, MemoOptions } from '../memo.annotation';
import { MemoAspect, MemoAspectOptions } from '../memo.aspect';
import { IdbMemoDriver, LsMemoDriver } from '../drivers';
import { DefaultCacheableAspect } from '../cacheable/cacheable.aspect';
import { weaverContext, JitWeaver } from '@aspectjs/core';

interface MemoClass {
    memoMethod(...args: any[]): any;
}

export function createMemoMethod(method?: (...args: any[]) => any, options?: MemoOptions) {
    class MemoClassImpl implements MemoClass {
        @Memo(options)
        memoMethod(...args: any[]): any {
            return method(...args);
        }
    }

    const r = new MemoClassImpl();
    return r.memoMethod.bind(r);
}

export function resetWeaver() {
    weaverContext.setWeaver(new JitWeaver());
}
export function setupMemoAspect(memoAspectOptions?: MemoAspectOptions): void {
    resetWeaver();

    const memoAspect = new MemoAspect(memoAspectOptions);
    memoAspect.drivers(new LsMemoDriver(), new IdbMemoDriver());
    weaverContext.getWeaver().enable(memoAspect, new DefaultCacheableAspect());
}
