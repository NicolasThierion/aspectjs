import { Aspect, AspectHooks } from '../types';
import { AClass } from '../../tests/a';
import { AnnotationContext } from '../../annotation/context/context';
import { WeavingError } from '../weaving-error';
import { Weaver } from './load-time-weaver';
import { setWeaver } from '../../index';

function setupWeaver(...aspects: Aspect[]) {
    const weaver = new Weaver().enable(...aspects);
    setWeaver(weaver);
    weaver.load();
}

describe('given a class configured with some class-annotation aspect', () => {
    describe('that leverage "before" pointcut', () => {
        const advice = jasmine.createSpy('advice');
        const ctor = jasmine.createSpy('ctor');
        beforeEach(() => {
            class AAspect extends Aspect {
                name = 'AClassLabel';

                apply(hooks: AspectHooks): void {
                    hooks.annotations(AClass).class.before(advice);
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

                    apply(hooks: AspectHooks): void {
                        hooks.annotations(AClass).class.before((ctxt: AnnotationContext<any, any>) => {
                            console.log(ctxt.instance);
                        });
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
                }).toThrow(new WeavingError('cannot get instance of "this" before constructor has been called'));
            });
        });
    });
});
