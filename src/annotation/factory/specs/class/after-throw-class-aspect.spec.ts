import { AfterThrowAdvice, Aspect, AspectHooks } from '../../../../weaver/types';
import { AClass } from '../../../../tests/a';
import { ClassAnnotationContext } from '../../../context/context';
import { Weaver } from '../../../../weaver/load-time/load-time-weaver';
import { setWeaver } from '../../../../index';
import Spy = jasmine.Spy;

interface Labeled {
    labels?: string[];
}

function setupWeaver(...aspects: Aspect[]): void {
    const weaver = new Weaver().enable(...aspects);
    setWeaver(weaver);
    weaver.load();
}

let afterThrowAdvice: AfterThrowAdvice<any> = (ctxt, error: Error) => {
    throw new Error('should configure afterThrowAdvice');
};

let afterThrowAdviceSpy: Spy;
fdescribe('given a class configured with some class-annotation aspect', () => {
    describe('that leverage "afterThrow" pointcut', () => {
        beforeEach(() => {
            class AfterThrowAspect extends Aspect {
                name = 'AClassLabel';

                apply(hooks: AspectHooks): void {
                    hooks.annotations(AClass).class.afterThrow((ctxt, error) => afterThrowAdvice(ctxt, error));
                }
            }
            afterThrowAdviceSpy = jasmine.createSpy('afterThrowAdvice', afterThrowAdvice).and.callThrough();

            setupWeaver(new AfterThrowAspect());
        });
        fdescribe('creating an instance of this class', () => {
            describe('with a constructor that throws', () => {
                beforeEach(() => {
                    afterThrowAdviceSpy = jasmine
                        .createSpy('afterThrowAdvice', (ctxt: ClassAnnotationContext<Labeled>, error) => {
                            ctxt.instance.labels = ctxt.instance.labels ?? [];
                            ctxt.instance.labels.push('A');
                            throw error;
                        })
                        .and.callThrough();
                });

                it('should call the aspect', () => {
                    @AClass()
                    class A implements Labeled {
                        public labels: string[];
                        constructor(label: string) {
                            this.labels = [label];
                            throw new Error('expected');
                        }
                    }

                    expect(() => {
                        new A('ctor');
                    }).toThrow();
                    expect(afterThrowAdvice).toHaveBeenCalled();
                });

                fdescribe('when the aspect swallows the exception', () => {
                    beforeEach(() => {
                        afterThrowAdvice = jasmine.createSpy(
                            'afterThrowAdvice',
                            (ctxt: ClassAnnotationContext<Labeled>, error) => {
                                ctxt.instance.labels = ctxt.instance.labels ?? [];
                                ctxt.instance.labels.push('A');
                            },
                        );
                    });

                    fit('should not throw', () => {
                        @AClass()
                        class A implements Labeled {
                            public labels: string[];
                            constructor(label: string) {
                                this.labels = [label];

                                throw new Error('expected');
                            }
                        }

                        let labels: string[];

                        expect(() => {
                            const a = new A('ctor');
                            labels = a.labels;
                        }).not.toThrow();
                        expect(afterThrowAdvice).toHaveBeenCalled();
                        expect(labels).toEqual(['ctor', 'AClass']);
                    });
                });
            });

            describe('with a constructor that do not throws', () => {
                it('should call not the aspect', () => {
                    @AClass()
                    class A implements Labeled {
                        public labels: string[];
                        constructor(label: string) {
                            this.labels = [label];
                        }
                    }

                    expect(afterThrowAdviceSpy).not.toHaveBeenCalled();
                });
            });
        });
    });
});
