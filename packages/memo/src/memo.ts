import { getWeaver } from '@aspectjs/core';
import { defaultMemoProfile } from './profiles/default.profile';
import { MemoAspectOptions } from './memo.aspect';

export function registerDefaultMemo(memoAspectOptions?: MemoAspectOptions) {
    getWeaver().enable(defaultMemoProfile(memoAspectOptions));
}
