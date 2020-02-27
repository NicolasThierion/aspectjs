import { Memo } from './memo';
import { getWeaver, WeaverProfile } from '@aspectjs/core';
import { LsMemoAspect } from './localstorage/memo-localstorage';
import { LzCacheHandler } from './localstorage/lz-cache-handler';

export const defaultLsMemoProfile = new WeaverProfile().enable(
    new LsMemoAspect({
        handler: new LzCacheHandler(),
    }),
);

getWeaver().enable(defaultLsMemoProfile);

export { Memo };
