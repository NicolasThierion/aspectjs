import { JitWeaver } from './jit-weaver';
import { WEAVER_CONTEXT } from '../weaver-context';
import { Aspect } from '../../advice/aspect';
import { WeavingError } from '../errors/weaving-error';

let weaver: JitWeaver;

const WEAVER_TEST_NAME = 'testWeaver';

describe('JitWeaver', () => {
    beforeEach(() => {
        weaver = new JitWeaver(WEAVER_TEST_NAME);
        WEAVER_CONTEXT.setWeaver(weaver);
    });

    describe('.enable()', () => {
        xdescribe('after weaver has proceeded', () => {
            it('should throw an error', () => {
                expect(() => {
                    @Aspect('AClassLabel')
                    class AAspect {}
                    weaver.enable(new AAspect());
                }).toThrow(new WeavingError('Weaver "testWeaver" already loaded: Cannot enable or disable aspects'));
            });
        });
    });
});
