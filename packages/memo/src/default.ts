import { Memo } from './memo.annotation';
import { getWeaver, WeaverProfile } from '@aspectjs/core';
import { LsMemo, LsMemoAspect } from './localstorage/memo-localstorage';
import { LzMemoHandler } from './localstorage/lz-memo-handler';
import { IndexedDbMemoAspect } from './indexed-db/memo-indexed-db';
import { DefaultCacheableAspect } from './cacheable-aspect';

/**
 * Weaver profile configured with
 * - LsMemoAspect (for synchronous @Memo methods)
 *     - LzMemoHandler to compress data stored in LocalStorage
 * - IndexedDbMemoAspect (for asynchronous @Memo methods)
 */
export const defaultLsMemoProfile = new WeaverProfile().enable(
    new LsMemoAspect({
        handler: new LzMemoHandler(),
    }),
    new DefaultCacheableAspect(),
    new IndexedDbMemoAspect(),
);

export const defaultMemoProfile = defaultLsMemoProfile;

getWeaver().enable(defaultMemoProfile);

export { Memo, LsMemo };
