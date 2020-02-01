import { Memo } from './memo';
import { localStorageMemoProfile } from './memo-localstorage';
import { getWeaver } from '../../src';

getWeaver().enable(localStorageMemoProfile);

export { Memo };
