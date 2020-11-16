import { Weaver } from '@aspectjs/core/commons';
import { setupTestingWeaverContext } from '@aspectjs/core/testing';

import { Memo, MemoOptions } from '../memo.annotation';
import { MemoAspect, MemoAspectOptions } from '../memo.aspect';
import { DefaultCacheableAspect } from '../cacheable/cacheable.aspect';
import { IdbMemoDriver, LsMemoDriver } from '../drivers';

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

export function setupMemoAspect(memoAspectOptions?: MemoAspectOptions): Weaver {
    return setupTestingWeaverContext(
        new MemoAspect({
            ...memoAspectOptions,
            drivers: memoAspectOptions?.drivers ?? [new LsMemoDriver(), new IdbMemoDriver()],
        }),
        new DefaultCacheableAspect(),
    ).getWeaver();
}
