import { Memo } from './default';

function _process(args: any[]) {
    return args.reverse();
}

describe('@Memo with LocalStorage profile', () => {
    class Runner {
        @Memo()
        process(...args: any[]) {
            return _process(args);
        }
    }
});
