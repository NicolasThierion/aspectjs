import { AnnotationFactory } from '../annotation/factory/factory';
import { setWeaver } from '../../index';
import { Weaver } from './load-time-weaver';
import { Aspect, AspectHooks } from '../types';
import { WeavingError } from '../weaving-error';

let weaver: Weaver;

let factory: AnnotationFactory;

const FACTORY_GROUP_TEST_ID = 'testFactory';
const WEAVER_TEST_NAME = 'testWeaver';

describe('LoadTimeWeaver', () => {
    beforeEach(() => {
        factory = new AnnotationFactory(FACTORY_GROUP_TEST_ID);
        weaver = new Weaver(WEAVER_TEST_NAME);
        setWeaver(weaver);
    });

    describe('.enable()', () => {
        describe('after weaver has proceeded', () => {
            beforeEach(() => {
                weaver.load();
            });
            it('should throw an error', () => {
                expect(() => {
                    class AAspect extends Aspect {
                        name = 'AClassLabel';

                        apply(hooks: AspectHooks): void {}
                    }
                    weaver.enable(new AAspect());
                }).toThrow(new WeavingError('Weaver "testWeaver" already loaded: Cannot enable or disable aspects'));
            });
        });
    });
});
