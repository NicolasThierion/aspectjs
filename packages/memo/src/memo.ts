import { WEAVER_CONTEXT } from '@aspectjs/core';
import { defaultMemoProfile } from './profiles/default.profile';
import { MemoAspectOptions } from './memo.aspect';

export function registerDefaultMemo(memoAspectOptions?: MemoAspectOptions) {
    WEAVER_CONTEXT.getWeaver().enable(defaultMemoProfile(memoAspectOptions));
}
