import { AfterThrowAdvice, Aspect, AspectHooks } from '../../../../weaver/types';
import { AClass } from '../../../../tests/a';
import { Weaver } from '../../../../weaver/load-time/load-time-weaver';
import { ClassAnnotation, setWeaver } from '../../../../index';
import { AnnotationAdviceContext } from '../../../../weaver/annotation-advice-context';

interface Labeled {
    labels?: string[];
}

function setupWeaver(...aspects: Aspect[]): void {
    const weaver = new Weaver().enable(...aspects);
    setWeaver(weaver);
    weaver.load();
}

let afterThrowAdvice: AfterThrowAdvice<any> = ctxt => {
    throw new Error('should configure afterThrowAdvice');
};

let afterThrowAdviceSpy: jest.Mock;
describe('given a class configured with some class-annotation aspect', () => {
    describe('that leverage "afterThrow" pointcut', () => {
        beforeEach(() => {
            afterThrowAdvice = (ctxt: AnnotationAdviceContext<Labeled, ClassAnnotation>) => {
                ctxt.instance.instance().labels = ctxt.instance.instance().labels ?? [];
                ctxt.instance.instance().labels.push('A');
            };
            afterThrowAdviceSpy = jest.fn().mockImplementation(afterThrowAdvice);
            class AfterThrowAspect extends Aspect {
                name = 'AClassLabel';

                apply(hooks: AspectHooks): void {
                    hooks.annotations(AClass).class.afterThrow(ctxt => afterThrowAdviceSpy(ctxt));
                }
            }

            setupWeaver(new AfterThrowAspect());
        });
        describe('creating an instance of this class', () => {
            describe('with a constructor that throws', () => {
                beforeEach(() => {
                    afterThrowAdvice = (ctxt: AnnotationAdviceContext<Labeled, ClassAnnotation>) => {
                        ctxt.instance.instance().labels = ctxt.instance.instance().labels ?? [];
                        ctxt.instance.instance().labels.push('A');
                        throw ctxt.error;
                    };
                    afterThrowAdviceSpy = jest.fn().mockImplementation(afterThrowAdvice);
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
                        afterThrowAdvice = (ctxt: AnnotationAdviceContext<Labeled, ClassAnnotation>) => {
                            ctxt.instance.instance().labels = ctxt.instance.instance().labels ?? [];
                            ctxt.instance.instance().labels.push('A');
                        };
                        afterThrowAdviceSpy = jest.fn().mockImplementation(afterThrowAdvice);
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

            describe('and the aspect returns a new value', () => {
                beforeEach(() => {
                    afterThrowAdvice = (ctxt: AnnotationAdviceContext<Labeled, ClassAnnotation>) => {
                        return Object.assign(Object.create(ctxt.annotation.target.proto), {
                            labels: ['ABis'],
                        });
                    };
                    afterThrowAdviceSpy = jest.fn().mockImplementation(afterThrowAdvice);
                });

                it('should assign "this" instance to the returned value', () => {
                    @AClass()
                    class A implements Labeled {
                        public labels: string[];
                        constructor(label: string) {
                            this.labels = [label];

                            throw new Error('expected');
                        }
                    }
                    const a = new A('test');
                    expect(a.labels).toEqual(['ABis']);
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
