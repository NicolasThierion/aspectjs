import { Memo } from './memo.annotation';
import { getWeaver, WeaverProfile } from '@aspectjs/core';
import { LsMemoDriver } from './drivers/localstorage/localstorage.driver';
import { LzMemoSerializer } from './drivers/localstorage/lz-memo.serializer';
import { IndexedDbDriver } from './drivers/indexed-db/indexed-db.driver';
import { DefaultCacheableAspect } from './cacheable/cacheable.aspect';

/**
 * Weaver profile configured with
 * - LsMemoAspect (for synchronous @Memo methods)
 *     - LzMemoHandler to compress data stored in LocalStorage
 * - IndexedDbMemoAspect (for asynchronous @Memo methods)
 */
export const defaultLsMemoProfile = new WeaverProfile().enable(
    new LsMemoDriver({
        serializer: new LzMemoSerializer(),
    }),
    new DefaultCacheableAspect(),
    new IndexedDbDriver(),
);

export const defaultMemoProfile = defaultLsMemoProfile;

getWeaver().enable(defaultMemoProfile);

export { Memo };
