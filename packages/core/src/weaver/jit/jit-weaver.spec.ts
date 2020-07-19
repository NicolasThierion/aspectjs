import { AnnotationFactory } from '../../annotation/factory/factory';
import { WeavingError } from '../errors/weaving-error';
import { JitWeaver } from './jit-weaver';
import { Aspect } from '../../advice/aspect';
import { setWeaver } from '../weaver';

let weaver: JitWeaver;

let factory: AnnotationFactory;

const FACTORY_GROUP_TEST_ID = 'testFactory';
const WEAVER_TEST_NAME = 'testWeaver';

describe('JitWeaver', () => {
    beforeEach(() => {
        factory = new AnnotationFactory(FACTORY_GROUP_TEST_ID);
        weaver = new JitWeaver(WEAVER_TEST_NAME);
        setWeaver(weaver);
    });

    describe('.enable()', () => {
        describe('after weaver has proceeded', () => {
            beforeEach(() => {
                weaver.load();
            });
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
