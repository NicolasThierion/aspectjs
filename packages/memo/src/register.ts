import { Memo } from './memo.annotation';
import { getWeaver } from '@aspectjs/core';
import { defaultMemoProfile } from './default.profile';

getWeaver().enable(defaultMemoProfile);

export { Memo };
