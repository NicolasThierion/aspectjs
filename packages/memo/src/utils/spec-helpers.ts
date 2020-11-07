import { Memo, MemoOptions } from '../memo.annotation';
import { MemoAspect, MemoAspectOptions } from '../memo.aspect';
import { DefaultCacheableAspect } from '../cacheable/cacheable.aspect';
import { Weaver } from '@aspectjs/core';
import { resetWeaverContext } from '@aspectjs/core/testing';

interface MemoClass {
    memoMethod(...args: any[]): any;
}

export function createMemoMethod(method?: (...args: any[]) => any, options?: MemoOptions) {
    debugger;
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
    // const weaver = WEAVER_CONTEXT.getWeaver();
    //
    // let memoAspect = weaver.getAspect(MemoAspect);
    // if (!memoAspect) {
    //     memoAspect = new MemoAspect();
    //     weaver.enable(memoAspect).enable(new DefaultCacheableAspect());
    // }
    // memoAspect.drivers(new LsMemoDriver(), new IdbMemoDriver());

    return resetWeaverContext(new MemoAspect(memoAspectOptions), new DefaultCacheableAspect()).getWeaver();
}
