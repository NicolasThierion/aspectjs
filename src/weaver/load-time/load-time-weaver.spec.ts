import { AnnotationFactory } from '../../annotation/factory/factory';
import { setWeaver } from '../../index';
import { Aspect } from '../types';
import { WeavingError } from '../weaving-error';
import { LoadTimeWeaver } from './load-time-weaver';

let weaver: LoadTimeWeaver;

let factory: AnnotationFactory;

const FACTORY_GROUP_TEST_ID = 'testFactory';
const WEAVER_TEST_NAME = 'testWeaver';

describe('LoadTimeWeaver', () => {
    beforeEach(() => {
        factory = new AnnotationFactory(FACTORY_GROUP_TEST_ID);
        weaver = new LoadTimeWeaver(WEAVER_TEST_NAME);
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
                        id = 'AClassLabel';
                    }
                    weaver.enable(new AAspect());
                }).toThrow(new WeavingError('Weaver "testWeaver" already loaded: Cannot enable or disable aspects'));
            });
        });
    });
});
