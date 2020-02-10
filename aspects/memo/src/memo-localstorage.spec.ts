import { Memo } from './default';
import { setupWeaver } from '../../../tests/helpers';
import { LocalStorageMemo } from './memo-localstorage';

function _process(args: any[]) {
    return args.reverse();
}

describe('@Memo with LocalStorage aspect', () => {

    beforeEach(() => {
        setupWeaver(new LocalStorageMemo());

        class Runner {
            @Memo()
            process(...args: any[]) {
                return _process(args);
            }
        }
    })

    describe('when the method is called twice', () => {


        it('should not invoke the method twice', () => {


        })

    })
});
