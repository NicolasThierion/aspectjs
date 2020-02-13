import { Memo } from './memo';
import { localStorageMemoProfile } from './memo-localstorage';
import { getWeaver } from '@aspectjs/core';

getWeaver().enable(localStorageMemoProfile);

export { Memo };
