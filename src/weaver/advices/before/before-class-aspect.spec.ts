import { Aspect } from '../../types';
import { AClass } from '../../../tests/a';
import { setWeaver } from '../../../index';
import { AdviceContext } from '../advice-context';
import { Before } from './before.decorator';
import { LoadTimeWeaver } from '../../load-time/load-time-weaver';
import { pc } from '../pointcut';
import { AdviceType } from '../types';

function setupWeaver(...aspects: Aspect[]) {
    const weaver = new LoadTimeWeaver().enable(...aspects);
    setWeaver(weaver);
    weaver.load();
}
// TODO describe('on a class that do not extends aspect') it('should throw an error');
describe('given a class configured with some annotation aspect', () => {
    describe('that leverage "before" pointcut', () => {
        const advice = jasmine.createSpy('advice');
        const ctor = jasmine.createSpy('ctor');
        beforeEach(() => {
            class AAspect extends Aspect {
                id = 'AClassLabel';

                @Before(pc.class.annotations(AClass))
                applyBefore(ctxt: AdviceContext<any, AdviceType.CLASS>): void {
                    expect(this).toEqual(jasmine.any(AAspect));

                    advice(ctxt);
                }
            }

            setupWeaver(new AAspect());
        });
        it('should call the aspect before the constructor', () => {
            @AClass()
            class A {
                constructor() {
                    ctor();
                }
            }

            new A();
            expect(advice).toHaveBeenCalled();
            expect(ctor).toHaveBeenCalled();
            expect(advice).toHaveBeenCalledBefore(ctor);
        });

        it('should have a "null" context.instance', () => {
            let thisInstance: any;
            class AAspect extends Aspect {
                id = 'AClassLabel';

                @Before(pc.class.annotations(AClass))
                apply(ctxt: AdviceContext<any, AdviceType.CLASS>): void {
                    thisInstance = (ctxt as any).instance;
                }
            }

            setupWeaver(new AAspect());

            @AClass()
            class A {
                constructor() {}
            }

            new A();

            expect(thisInstance).toBeUndefined();
        });
    });
});
