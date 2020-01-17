import { Aspect } from '../../types';
import { AdviceType, AfterAdvice } from '../types';
import { ClassAnnotation, setWeaver } from '../../../index';
import { After } from './after.decorator';
import { AClass } from '../../../tests/a';
import { AdviceContext } from '../advice-context';
import { LoadTimeWeaver } from '../../load-time/load-time-weaver';
import { pc } from '../pointcut';
import { WeavingError } from '../../weaving-error';

interface Labeled {
    labels?: string[];
}

function setupWeaver(...aspects: Aspect[]): void {
    const weaver = new LoadTimeWeaver().enable(...aspects);
    setWeaver(weaver);
    weaver.load();
}

let afterAdvice: AfterAdvice<any> = ctxt => {
    throw new Error('should configure afterThrowAdvice');
};

describe('given a class configured with some annotation aspect', () => {
    describe('that leverage "after" pointcut', () => {
        beforeEach(() => {
            class AfterAspect extends Aspect {
                id = 'AClassLabel';

                @After(pc.class.annotations(AClass))
                apply(ctxt: AdviceContext<any, AdviceType.CLASS>): void {
                    expect(this).toEqual(jasmine.any(AfterAspect));
                    afterAdvice(ctxt);
                }
            }

            afterAdvice = jasmine
                .createSpy('afterAdvice', function(ctxt) {
                    ctxt.instance.labels = ctxt.instance.labels ?? [];
                    ctxt.instance.labels.push('AClass');
                })
                .and.callThrough();

            setupWeaver(new AfterAspect());
        });

        describe('when advice returns a value', () => {
            it('should throw an error', () => {
                class BadAfterAspect extends Aspect {
                    id = 'AClassLabel';

                    @After(pc.class.annotations(AClass))
                    apply(ctxt: AdviceContext<any, AdviceType.CLASS>) {
                        return function() {};
                    }
                }

                setupWeaver(new BadAfterAspect());

                expect(() => {
                    @AClass()
                    class X {}

                    new X();
                }).toThrow(
                    new WeavingError('Returning from advice "@After(@AClass) BadAfterAspect.apply()" is not supported'),
                );
            });
        });

        describe('creating an instance of this class', () => {
            it('should invoke the aspect', () => {
                @AClass()
                class A implements Labeled {}

                const instance = new A() as Labeled;
                const labels = instance.labels;
                expect(labels).toBeDefined();
                expect(labels).toEqual(['AClass']);
            });

            it('should produce a class of the same class instance', () => {
                @AClass()
                class A implements Labeled {}

                const instance = new A();
                expect(instance instanceof A).toBeTrue();
            });
            it('should call the original constructor after the aspect', () => {
                @AClass()
                class A implements Labeled {
                    labels: string[];
                    constructor() {
                        this.labels = (this.labels ?? []).concat('ctor');
                    }
                }

                const labels = (new A() as Labeled).labels;
                expect(labels).toBeDefined();
                expect(labels).toEqual(['ctor', 'AClass']);
            });

            it('should pass down the constructor argument', () => {
                @AClass()
                class A implements Labeled {
                    labels: string[];
                    constructor(lbl: string) {
                        this.labels = (this.labels ?? []).concat(lbl);
                    }
                }

                const labels = (new A('lbl') as Labeled).labels;
                expect(labels).toBeDefined();
                expect(labels).toEqual(['lbl', 'AClass']);
            });

            describe('when the constructor throws', () => {
                it('should call the "after" advice', () => {
                    @AClass()
                    class A {
                        constructor() {
                            throw new Error('');
                        }
                    }
                    expect(afterAdvice).not.toHaveBeenCalled();

                    try {
                        new A();
                    } catch (e) {}
                    expect(afterAdvice).toHaveBeenCalled();
                });
            });
        });
    });
});
