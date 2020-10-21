import { WeaverProfile } from '@aspectjs/core';
import { IdbMemoDriver, LsMemoDriver, LzMemoSerializer } from '../drivers';
import { DefaultCacheableAspect } from '../cacheable/cacheable.aspect';
import { MemoAspect, MemoAspectOptions } from '../memo.aspect';

/**
 * Weaver profile configured with
 * - LsMemoAspect (for synchronous @Memo methods)
 *     - LzMemoHandler to compress data stored in LocalStorage
 * - IndexedDbMemoAspect (for asynchronous @Memo methods)
 */
export function defaultMemoProfile(memoOptions?: MemoAspectOptions) {
    return new WeaverProfile().enable(
        new MemoAspect(memoOptions).drivers(
            new LsMemoDriver({
                serializer: new LzMemoSerializer(),
            }),
            new IdbMemoDriver(),
        ),
        new DefaultCacheableAspect(),
    );
}
