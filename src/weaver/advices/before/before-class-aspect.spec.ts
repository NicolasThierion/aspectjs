import { Aspect } from '../../types';
import { AClass } from '../../../tests/a';
import { WeavingError } from '../../weaving-error';
import { Weaver } from '../../load-time/load-time-weaver';
import { ClassAnnotation, setWeaver } from '../../../index';
import { AdviceContext } from '../../advice-context';
import { Before } from './before.decorator';

function setupWeaver(...aspects: Aspect[]) {
    const weaver = new Weaver().enable(...aspects);
    setWeaver(weaver);
    weaver.load();
}
// TODO describe('on a class that do not extends aspect') it('should throw an error');
describe('given a class configured with some class-annotation aspect', () => {
    describe('that leverage "before" pointcut', () => {
        const advice = jasmine.createSpy('advice');
        const ctor = jasmine.createSpy('ctor');
        beforeEach(() => {
            class AAspect extends Aspect {
                name = 'AClassLabel';

                @Before(AClass)
                applyBefore(ctxt: AdviceContext<any, ClassAnnotation>): void {
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

        describe('and the aspect requires "this"', () => {
            beforeEach(() => {
                class AAspect extends Aspect {
                    name = 'AClassLabel';

                    @Before(AClass)
                    apply(ctxt: AdviceContext<any, ClassAnnotation>): void {
                        console.log((ctxt as any).instance.get());
                    }
                }

                setupWeaver(new AAspect());
            });
            it('should throw an error', () => {
                expect(() => {
                    @AClass()
                    class A {
                        constructor() {}
                    }

                    new A();
                }).toThrow(new WeavingError('Cannot get "this" instance before constructor joinpoint has been called'));
            });
        });
    });
});
