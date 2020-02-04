import { Memo } from './memo';
import { localStorageMemoProfile } from './memo-localstorage';
import { getWeaver } from '../../src/lib';

getWeaver().enable(localStorageMemoProfile);

export { Memo };
