import { Aspect } from '../../types';
import { ClassAnnotation, setWeaver } from '../../../index';
import { AfterReturnAdvice } from '../types';
import { AClass } from '../../../tests/a';
import { AfterReturn } from './after-return.decorator';
import { AdviceContext, AfterReturnContext } from '../advice-context';
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

let afterReturn: AfterReturnAdvice<any> = (ctxt, retVal) => {
    throw new Error('should configure afterThrowAdvice');
};

describe('given a class configured with some class-annotation aspect', () => {
    describe('that leverage "afterReturn" pointcut', () => {
        beforeEach(() => {
            class AfterReturnAspect extends Aspect {
                name = 'AClassLabel';

                @AfterReturn(pc.class.annotations(AClass))
                apply(ctxt: AfterReturnContext<any, ClassAnnotation>, retVal: any): void {
                    expect(retVal).toEqual(ctxt.returnValue);
                    return afterReturn(ctxt, retVal);
                }
            }

            afterReturn = jasmine
                .createSpy('afterReturnAdvice', function(ctxt) {
                    ctxt.instance.labels = ctxt.instance.labels ?? [];
                    ctxt.instance.labels.push('AClass');
                })
                .and.callThrough();

            setupWeaver(new AfterReturnAspect());
        });

        describe('creating an instance of this class', () => {
            describe('with a constructor that throws', () => {
                it('should not call the aspect', () => {
                    @AClass()
                    class A implements Labeled {
                        constructor(label: string) {
                            throw new Error('expected');
                        }
                    }

                    expect(() => {
                        new A('ctor');
                    }).toThrow();
                    expect(afterReturn).not.toHaveBeenCalled();
                });
            });

            describe('with a constructor that do not throws', () => {
                it('should call the aspect', () => {
                    @AClass()
                    class A implements Labeled {
                        public labels: string[];
                        constructor(label: string) {
                            this.labels = [label];
                        }
                    }

                    const labels = new A('ctor').labels;
                    expect(afterReturn).toHaveBeenCalled();
                    expect(labels).toEqual(['ctor', 'AClass']);
                });

                describe('and the aspect returns a new value', () => {
                    beforeEach(() => {
                        afterReturn = (ctxt: AdviceContext<Labeled, ClassAnnotation>) => {
                            return Object.assign(Object.create(ctxt.annotation.target.proto), {
                                labels: ['ABis'],
                            });
                        };
                        afterReturn = jasmine.createSpy('afterReturn', afterReturn).and.callThrough();
                    });

                    it('should assign "this" instance to the returned value', () => {
                        @AClass()
                        class A implements Labeled {
                            public labels: string[];
                            constructor(label: string) {
                                this.labels = [label];
                            }
                        }
                        const a = new A('test');
                        expect(a.labels).toEqual(['ABis']);
                    });
                });
            });
        });
    });
});
