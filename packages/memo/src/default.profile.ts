import { Memo } from './memo.annotation';
import { getWeaver, WeaverProfile } from '@aspectjs/core';
import { LsMemoDriver } from './drivers/localstorage/localstorage.driver';
import { LzMemoSerializer } from './drivers/localstorage/lz-memo.serializer';
import { IdbMemoDriver } from './drivers/indexed-db/idb-memo.driver';
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
    new IdbMemoDriver(),
);

export const defaultMemoProfile = defaultLsMemoProfile;

getWeaver().enable(defaultMemoProfile);

export { Memo };
