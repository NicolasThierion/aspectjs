import { AClass } from '../../../tests/a';
import { AfterReturn } from './after-return.decorator';
import { AdviceContext, AfterReturnContext } from '../advice-context';
import { on } from '../pointcut';
import { AMethod, AProperty, Labeled, setupWeaver } from '../../../tests/helpers';
import { Compile } from '../compile/compile.decorator';
import { WeavingError } from '../../weaving-error';
import Spy = jasmine.Spy;
import { Aspect } from '../aspect';
import { AnnotationType } from '../../..';

describe('@AfterReturn advice', () => {
    let afterReturn: Spy;
    beforeEach(() => {
        afterReturn = jasmine.createSpy('afterReturnAdvice', function(ctxt) {}).and.callThrough();
    });
    describe('applied on some class', () => {
        beforeEach(() => {
            @Aspect('AClassLabel')
            class AfterReturnAspect {
                @AfterReturn(on.class.withAnnotations(AClass))
                apply(ctxt: AfterReturnContext<any, AnnotationType.CLASS>, retVal: any): void {
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
                            .createSpy('afterReturn', (ctxt: AdviceContext<Labeled, AnnotationType.CLASS>) => {
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
                @Aspect('PropAspect')
                class PropAspect {
                    @Compile(on.property.withAnnotations(AProperty))
                    compile() {
                        expect(this).toEqual(jasmine.any(PropAspect));

                        return {
                            get() {
                                throw new Error('expected');
                            },
                        };
                    }

                    @AfterReturn(on.property.withAnnotations(AProperty))
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
                @Aspect('PropAspect')
                class PropAspect {
                    @AfterReturn(on.property.withAnnotations(AProperty))
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
                    @Aspect('PropAspect')
                    class PropAspect {
                        @AfterReturn(on.property.withAnnotations(AProperty))
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
                @Aspect('PropAspect')
                class PropAspect {
                    @Compile(on.property.withAnnotations(AProperty))
                    compile() {
                        expect(this).toEqual(jasmine.any(PropAspect));

                        return {
                            set() {
                                throw new Error('expected');
                            },
                        };
                    }

                    @AfterReturn(on.property.setter.withAnnotations(AProperty))
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
                @Aspect('PropAspect')
                class PropAspect {
                    @AfterReturn(on.property.setter.withAnnotations(AProperty))
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
                    @Aspect('PropAspect')
                    class PropAspect {
                        @AfterReturn(on.property.setter.withAnnotations(AProperty))
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

    describe('applied on a method', () => {
        beforeEach(() => {
            afterReturn = jasmine
                .createSpy('afterReturnAdvice', function(ctxt) {
                    return ctxt.value;
                })
                .and.callThrough();

            @Aspect('MethodAspect')
            class MethodAspect {
                @AfterReturn(on.method.withAnnotations(AMethod))
                after(ctxt: AfterReturnContext<any, any>, returnValue: any) {
                    return afterReturn(ctxt, returnValue);
                }
            }
            setupWeaver(new MethodAspect());
        });

        let a: Labeled;

        describe('that throws', () => {
            beforeEach(() => {
                class A implements Labeled {
                    @AMethod()
                    addLabel() {
                        throw new Error('expected');
                    }
                }
                a = new A();
            });

            it('should not call the aspect', () => {
                expect(() => {
                    a.addLabel();
                }).toThrow();
                expect(afterReturn).not.toHaveBeenCalled();
            });
        });

        describe('that do not throws', () => {
            let returnValue: any;
            beforeEach(() => {
                returnValue = undefined;
                class A implements Labeled {
                    labels: string[] = [];
                    @AMethod()
                    addLabel(...args: string[]) {
                        return (this.labels = this.labels.concat(args));
                    }
                }
                a = new A();

                afterReturn = jasmine
                    .createSpy('afterReturnAdvice', function(ctxt, _returnValue) {
                        returnValue = _returnValue;
                        return ctxt.value.concat('afterReturn');
                    })
                    .and.callThrough();
            });

            it('should call the aspect', () => {
                expect(afterReturn).not.toHaveBeenCalled();
                a.addLabel('newValue');
                expect(afterReturn).toHaveBeenCalled();
            });

            it('should return the new value', () => {
                expect(a.labels).toEqual([]);
                expect(a.addLabel('newValue')).toEqual(['newValue', 'afterReturn']);
            });

            it('should pass to advice the original returned value as 2nd parameter', () => {
                expect(returnValue).toEqual(undefined);
                a.addLabel('newValue');
                expect(returnValue).toEqual(['newValue']);
            });
        });
    });
});
