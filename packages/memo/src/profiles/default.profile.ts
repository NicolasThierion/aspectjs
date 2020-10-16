import { WeaverProfile } from '@aspectjs/core';
import { IdbMemoDriver, LsMemoDriver, LzMemoSerializer } from '../drivers';
import { DefaultCacheableAspect } from '../cacheable/cacheable.aspect';
import { MemoAspect } from '../memo.aspect';

/**
 * Weaver profile configured with
 * - LsMemoAspect (for synchronous @Memo methods)
 *     - LzMemoHandler to compress data stored in LocalStorage
 * - IndexedDbMemoAspect (for asynchronous @Memo methods)
 */
export const defaultMemoProfile = new WeaverProfile().enable(
    new MemoAspect().drivers(
        new LsMemoDriver({
            serializer: new LzMemoSerializer(),
        }),
        new IdbMemoDriver(),
    ),
    new DefaultCacheableAspect(),
);
