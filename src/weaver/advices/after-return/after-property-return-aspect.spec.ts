import { Aspect } from '../../types';
import { setWeaver } from '../../../index';
import { AfterReturnAdvice } from '../types';
import { AfterReturn } from './after-return.decorator';
import { AdviceContext, AfterReturnContext } from '../advice-context';
import { LoadTimeWeaver } from '../../load-time/load-time-weaver';
import { pc } from '../pointcut';
import { AnnotationFactory } from '../../../annotation/factory/factory';
import { Compile } from '../compile/compile.decorator';

const AProperty = new AnnotationFactory('tests').create(function AProperty(): PropertyDecorator {
    return;
});

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

describe('given a property configured with some annotation aspect', () => {
    describe('that leverage "afterReturn" pointcut', () => {
        beforeEach(() => {
            afterReturn = jasmine.createSpy('afterReturnAdvice', function(ctxt, retVal: any[]) {}).and.callThrough();
        });

        describe('getting the property', () => {
            let a: Labeled;

            describe('with a property that throws', () => {
                beforeEach(() => {
                    class PropAspect extends Aspect {
                        id = 'PropAspect';
                        @Compile(pc.property.annotations(AProperty))
                        compile() {
                            return {
                                get() {
                                    throw new Error('expected');
                                },
                            };
                        }

                        @AfterReturn(pc.property.annotations(AProperty))
                        after() {
                            afterReturn(null, null);
                        }
                    }
                    setupWeaver(new PropAspect());

                    class A implements Labeled {
                        @AProperty()
                        labels: string[];
                    }
                    a = new A();
                });

                it('should not call the aspect', () => {
                    expect(() => {
                        console.log(a.labels);
                    }).toThrow();
                    expect(afterReturn).not.toHaveBeenCalled();
                });
            });

            describe('with a property that do not throws', () => {
                beforeEach(() => {
                    class PropAspect extends Aspect {
                        id = 'PropAspect';

                        @AfterReturn(pc.property.annotations(AProperty))
                        after(ctxt: AdviceContext<any, any>, returnValue: any) {
                            return afterReturn(ctxt, returnValue);
                        }
                    }
                    setupWeaver(new PropAspect());

                    class A implements Labeled {
                        @AProperty()
                        labels: string[] = ['x'];
                    }
                    a = new A();
                });

                it('should call the aspect', () => {
                    expect(afterReturn).not.toHaveBeenCalled();
                    const labels = a.labels;
                    expect(afterReturn).toHaveBeenCalled();
                });

                it('should return the original value', () => {
                    expect(a.labels).toEqual(['x']);
                });

                describe('and the aspect returns a new value', () => {
                    beforeEach(() => {
                        class PropAspect extends Aspect {
                            id = 'PropAspect';

                            @AfterReturn(pc.property.annotations(AProperty))
                            after(ctxt: AdviceContext<any, any>, returnValue: any) {
                                return returnValue.concat('a');
                            }
                        }
                        setupWeaver(new PropAspect());

                        class A implements Labeled {
                            @AProperty()
                            labels: string[] = ['x'];
                        }
                        a = new A();
                    });

                    it('should return the value returned by the advice', () => {
                        expect(a.labels).toEqual(['x', 'a']);
                    });
                });

                describe('and the aspect changes ctxt.value', () => {
                    beforeEach(() => {
                        class PropAspect extends Aspect {
                            id = 'PropAspect';

                            @AfterReturn(pc.property.annotations(AProperty))
                            after(ctxt: AfterReturnContext<any, any>, returnValue: any) {
                                ctxt.value = undefined;
                            }
                        }
                        setupWeaver(new PropAspect());

                        class A implements Labeled {
                            @AProperty()
                            labels: string[] = ['x'];
                        }
                        a = new A();
                    });

                    it('should return the value returned by the advice', () => {
                        expect(a.labels).toEqual(undefined);
                    });
                });
            });
        });
    });
});
