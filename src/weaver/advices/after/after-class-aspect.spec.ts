import { Aspect } from '../../types';
import { AfterAdvice } from '../types';
import { Weaver } from '../../load-time/load-time-weaver';
import { ClassAnnotation, setWeaver } from '../../../index';
import { After } from './after.decorator';
import { AClass } from '../../../tests/a';
import { AdviceContext } from '../../advice-context';

interface Labeled {
    labels?: string[];
}

function setupWeaver(...aspects: Aspect[]): void {
    const weaver = new Weaver().enable(...aspects);
    setWeaver(weaver);
    weaver.load();
}

let afterAdvice: AfterAdvice<any> = ctxt => {
    throw new Error('should configure afterThrowAdvice');
};

describe('given a class configured with some class-annotation aspect', () => {
    describe('that leverage "after" pointcut', () => {
        beforeEach(() => {
            class AfterAspect extends Aspect {
                name = 'AClassLabel';

                @After(AClass)
                apply(ctxt: AdviceContext<any, ClassAnnotation>): void {
                    afterAdvice(ctxt);
                }
            }

            afterAdvice = jasmine
                .createSpy('afterAdvice', function(ctxt) {
                    ctxt.instance.get().labels = ctxt.instance.get().labels ?? [];
                    ctxt.instance.get().labels.push('AClass');
                })
                .and.callThrough();

            setupWeaver(new AfterAspect());
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
