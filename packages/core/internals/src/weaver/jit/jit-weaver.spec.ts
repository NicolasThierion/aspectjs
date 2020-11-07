import { JitWeaver } from './jit-weaver';
import { Aspect } from '../../annotations';
import { WeavingError } from '../errors';
import { resetWeaverContext } from '../../../testing/src/helpers';
import { Weaver } from '../weaver';

let weaver: Weaver;

describe('JitWeaver', () => {
    beforeEach(() => {
        weaver = resetWeaverContext().getWeaver();
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
