import { Aspect } from '../../types';
import { AdviceType } from '../types';
import { AClass } from '../../../tests/a';
import { AfterReturn } from './after-return.decorator';
import { AdviceContext, AfterReturnContext } from '../advice-context';
import { on } from '../pointcut';
import { AProperty, Labeled, setupWeaver } from '../../../tests/helpers';
import { Compile } from '../compile/compile.decorator';
import { Mutable } from '../../../utils';
import Spy = jasmine.Spy;
import { WeavingError } from '../../weaving-error';

describe('@AfterReturn advice', () => {
    let afterReturn: Spy;
    beforeEach(() => {
        afterReturn = jasmine.createSpy('afterReturnAdvice', function(ctxt) {}).and.callThrough();
    });
    describe('applied on some class', () => {
        beforeEach(() => {
            class AfterReturnAspect extends Aspect {
                id = 'AClassLabel';

                @AfterReturn(on.class.annotations(AClass))
                apply(ctxt: AfterReturnContext<any, AdviceType.CLASS>, retVal: any): void {
                    expect(this).toEqual(jasmine.any(AfterReturnAspect));
                    expect(retVal).toEqual(ctxt.value);
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
                        afterReturn = jasmine
                            .createSpy('afterReturn', (ctxt: AdviceContext<Labeled, AdviceType.CLASS>) => {
                                return Object.assign(Object.create(ctxt.target.proto), {
                                    labels: ['ABis'],
                                });
                            })
                            .and.callThrough();
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

    describe('applied on a property', () => {
        beforeEach(() => {
            afterReturn = jasmine
                .createSpy('afterReturnAdvice', function(ctxt) {
                    return ctxt.value;
                })
                .and.callThrough();
        });

        let a: Labeled;

        describe('that throws', () => {
            beforeEach(() => {
                class PropAspect extends Aspect {
                    id = 'PropAspect';
                    @Compile(on.property.annotations(AProperty))
                    compile() {
                        expect(this).toEqual(jasmine.any(PropAspect));

                        return {
                            get() {
                                throw new Error('expected');
                            },
                        };
                    }

                    @AfterReturn(on.property.annotations(AProperty))
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

        describe('that do not throws', () => {
            beforeEach(() => {
                class PropAspect extends Aspect {
                    id = 'PropAspect';

                    @AfterReturn(on.property.annotations(AProperty))
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
                // afterReturn = jasmine.createSpy('afterReturnAdvice', function(ctxt) {
                //     return ctxt.value;
                // });
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

                        @AfterReturn(on.property.annotations(AProperty))
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
        });
    });

    describe('applied on a property setter', () => {
        beforeEach(() => {
            afterReturn = jasmine
                .createSpy('afterReturnAdvice', function(ctxt) {
                    return ctxt.value;
                })
                .and.callThrough();
        });

        let a: Labeled;

        describe('that throws', () => {
            beforeEach(() => {
                class PropAspect extends Aspect {
                    id = 'PropAspect';
                    @Compile(on.property.annotations(AProperty))
                    compile() {
                        expect(this).toEqual(jasmine.any(PropAspect));

                        return {
                            set() {
                                throw new Error('expected');
                            },
                        };
                    }

                    @AfterReturn(on.property.setter.annotations(AProperty))
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
                    a.labels = [];
                }).toThrow();
                expect(afterReturn).not.toHaveBeenCalled();
            });
        });

        describe('that do not throws', () => {
            beforeEach(() => {
                class PropAspect extends Aspect {
                    id = 'PropAspect';

                    @AfterReturn(on.property.setter.annotations(AProperty))
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

                afterReturn = jasmine.createSpy('afterReturnAdvice', function(ctxt) {});
            });

            it('should call the aspect', () => {
                expect(afterReturn).not.toHaveBeenCalled();
                a.labels = ['newValue'];
                expect(afterReturn).toHaveBeenCalled();
            });

            it('should return the new value', () => {
                a.labels = ['newValue'];
                expect(a.labels).toEqual(['newValue']);
            });

            describe('and the aspect returns a new value', () => {
                beforeEach(() => {
                    class PropAspect extends Aspect {
                        id = 'PropAspect';

                        @AfterReturn(on.property.setter.annotations(AProperty))
                        after(ctxt: AdviceContext<any, any>) {
                            return ['afterReturnValue'];
                        }
                    }
                    setupWeaver(new PropAspect());

                    class A implements Labeled {
                        @AProperty()
                        labels: string[];
                    }
                    a = new A();
                });

                it('should throw an error', () => {
                    expect(() => (a.labels = ['newValue'])).toThrow(
                        new WeavingError(
                            'Returning from advice "@AfterReturn(@AProperty) PropAspect.after()" is not supported',
                        ),
                    );
                });
            });
        });
    });
});
