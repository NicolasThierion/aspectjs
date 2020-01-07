import { Aspect } from '../../types';
import { ClassAnnotation, setWeaver } from '../../../index';
import { AfterThrowAdvice } from '../types';
import Spy = jasmine.Spy;
import { AdviceContext, AfterThrowContext } from '../advice-context';
import { AClass } from '../../../tests/a';
import { AfterThrow } from './after-throw.decorator';
import { LoadTimeWeaver } from '../../load-time/load-time-weaver';
import { pc } from '../pointcut';

interface Labeled {
    labels?: string[];
}

function setupWeaver(...aspects: Aspect[]): void {
    const weaver = new LoadTimeWeaver().enable(...aspects);
    setWeaver(weaver);
    weaver.load();
}

let afterThrowAdvice: AfterThrowAdvice<any> = ctxt => {
    throw new Error('should configure afterThrowAdvice');
};

let afterThrowAdviceSpy: Spy;
describe('given a class configured with some class-annotation aspect', () => {
    describe('that leverage "afterThrow" pointcut', () => {
        beforeEach(() => {
            afterThrowAdvice = (ctxt: AfterThrowContext<Labeled, ClassAnnotation>) => {
                ctxt.instance.labels = ctxt.instance.labels ?? [];
                ctxt.instance.labels.push('A');
            };
            afterThrowAdviceSpy = jasmine.createSpy('afterThrowAdvice', afterThrowAdvice).and.callThrough();
            class AfterThrowAspect extends Aspect {
                name = 'AClassLabel';

                @AfterThrow(pc.class.annotations(AClass))
                apply(ctxt: AfterThrowContext<any, ClassAnnotation>): void {
                    return afterThrowAdviceSpy(ctxt);
                }
            }

            setupWeaver(new AfterThrowAspect());
        });
        describe('creating an instance of this class', () => {
            describe('with a constructor that throws', () => {
                beforeEach(() => {
                    afterThrowAdvice = (ctxt: AfterThrowContext<Labeled, ClassAnnotation>) => {
                        ctxt.instance.labels = ctxt.instance.labels ?? [];
                        ctxt.instance.labels.push('A');
                        throw ctxt.error;
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
                        afterThrowAdvice = (ctxt: AfterThrowContext<Labeled, ClassAnnotation>) => {
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

            describe('and the aspect returns a new value', () => {
                beforeEach(() => {
                    afterThrowAdvice = (ctxt: AdviceContext<Labeled, ClassAnnotation>) => {
                        return Object.assign(Object.create(ctxt.annotation.target.proto), {
                            labels: ['ABis'],
                        });
                    };
                    afterThrowAdviceSpy = jasmine.createSpy('afterThrowAdvice', afterThrowAdvice).and.callThrough();
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
