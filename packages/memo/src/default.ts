import { Memo } from './memo.annotation';
import { getWeaver, WeaverProfile } from '@aspectjs/core';
import { LsMemo, LsMemoAspect } from './localstorage/memo-localstorage';
import { LzMemoHandler } from './localstorage/lz-memo-handler';
import { IndexedDBMemoAspect } from './indexed-db/memo-indexed-db';
import { DefaultCacheableAspect } from './cacheable-aspect';

export const defaultLsMemoProfile = new WeaverProfile().enable(
    new LsMemoAspect({
        handler: new LzMemoHandler(),
    }),
    new DefaultCacheableAspect(),
    new IndexedDBMemoAspect(),
);

export const defaultMemoProfile = defaultLsMemoProfile;

getWeaver().enable(defaultMemoProfile);

export { Memo, LsMemo };
