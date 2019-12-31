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
describe('given a class configured with some class-annotation aspect', () => {
    describe('that leverage "afterThrow" pointcut', () => {
        beforeEach(() => {
            afterThrowAdvice = (ctxt: ClassAnnotationContext<Labeled>, error) => {
                ctxt.instance.labels = ctxt.instance.labels ?? [];
                ctxt.instance.labels.push('A');
            };
            afterThrowAdviceSpy = jasmine.createSpy('afterThrowAdvice', afterThrowAdvice).and.callThrough();
            class AfterThrowAspect extends Aspect {
                name = 'AClassLabel';

                apply(hooks: AspectHooks): void {
                    hooks.annotations(AClass).class.afterThrow((ctxt, error) => afterThrowAdviceSpy(ctxt, error));
                }
            }

            setupWeaver(new AfterThrowAspect());
        });
        describe('creating an instance of this class', () => {
            describe('with a constructor that throws', () => {
                beforeEach(() => {
                    afterThrowAdvice = (ctxt: ClassAnnotationContext<Labeled>, error) => {
                        ctxt.instance.labels = ctxt.instance.labels ?? [];
                        ctxt.instance.labels.push('A');
                        throw error;
                    };
                    afterThrowAdviceSpy = jasmine.createSpy('afterThrowAdvice', afterThrowAdvice).and.callThrough();
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
                    expect(afterThrowAdviceSpy).toHaveBeenCalled();
                });

                describe('when the aspect swallows the exception', () => {
                    beforeEach(() => {
                        afterThrowAdvice = (ctxt: ClassAnnotationContext<Labeled>, error) => {
                            ctxt.instance.labels = ctxt.instance.labels ?? [];
                            ctxt.instance.labels.push('A');
                        };
                        afterThrowAdviceSpy = jasmine.createSpy('afterThrowAdvice', afterThrowAdvice).and.callThrough();
                    });

                    it('should not throw', () => {
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
                        expect(afterThrowAdviceSpy).toHaveBeenCalled();
                        expect(labels).toEqual(['A']);
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
