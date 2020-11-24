import { AfterReturn, Aspect, Compile } from '@aspectjs/core/annotations';
import { AClass, AMethod, AProperty, Labeled, setupTestingWeaverContext } from '@aspectjs/core/testing';

import { on } from '../../types';
import { Weaver } from '../../weaver';
import { AdviceContext, AdviceType, AfterReturnContext } from '../types';
import Spy = jasmine.Spy;

describe('@AfterReturn advice', () => {
    let advice: Spy;
    let aspectClass: any;
    let weaver: Weaver;
    beforeEach(() => {
        advice = jasmine.createSpy('advice').and.callFake(function (ctxt) {});
        weaver = setupTestingWeaverContext().getWeaver();
    });
    describe('applied on some class', () => {
        beforeEach(() => {
            @Aspect('AClassLabel')
            class AfterReturnAspect {
                @AfterReturn(on.class.withAnnotations(AClass))
                apply(ctxt: AfterReturnContext<any, AdviceType.CLASS>, retVal: any): void {
                    expect(retVal).toEqual(ctxt.value);
                    return advice.bind(this)(ctxt, retVal);
                }
            }
            aspectClass = AfterReturnAspect;

            advice = jasmine.createSpy('advice').and.callFake(function (ctxt) {
                ctxt.instance.labels = ctxt.instance.labels ?? [];
                ctxt.instance.labels.push('AClass');
            });

            weaver.enable(new AfterReturnAspect());
        });

        it('should bind this to the aspect instance', () => {
            advice = jasmine.createSpy('advice').and.callFake(function () {
                expect(this).toEqual(jasmine.any(aspectClass));
            });

            @AClass()
            class A {}
            new A();

            expect(advice).toHaveBeenCalled();
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
                    expect(advice).not.toHaveBeenCalled();
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
                    expect(advice).toHaveBeenCalled();
                    expect(labels).toEqual(['ctor', 'AClass']);
                });

                describe('and the aspect returns a new value', () => {
                    beforeEach(() => {
                        advice = jasmine
                            .createSpy('afterReturn')
                            .and.callFake((ctxt: AdviceContext<Labeled, AdviceType.CLASS>) => {
                                return Object.assign(Object.create(ctxt.target.proto), {
                                    labels: ['ABis'],
                                });
                            });
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
            advice = jasmine.createSpy('advice').and.callFake(function (ctxt) {
                return ctxt.value;
            });
        });

        let a: Labeled;

        describe('that throws', () => {
            beforeEach(() => {
                @Aspect('PropAspect')
                class PropAspect {
                    @Compile(on.property.withAnnotations(AProperty))
                    compile() {
                        return {
                            get() {
                                throw new Error('expected');
                            },
                        };
                    }

                    @AfterReturn(on.property.withAnnotations(AProperty))
                    after() {
                        advice(null, null);
                    }
                }
                weaver.enable(new PropAspect());

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
                expect(advice).not.toHaveBeenCalled();
            });
        });

        describe('that do not throws', () => {
            beforeEach(() => {
                @Aspect('PropAspect')
                class PropAspect {
                    @AfterReturn(on.property.withAnnotations(AProperty))
                    after(ctxt: AdviceContext, returnValue: any) {
                        return advice.bind(this)(ctxt, returnValue);
                    }
                }

                aspectClass = PropAspect;
                weaver.enable(new PropAspect());

                class A implements Labeled {
                    @AProperty()
                    labels: string[] = ['x'];
                }
                a = new A();
                // afterReturn = jasmine.createSpy('advice', function(ctxt) {
                //     return ctxt.value;
                // });
            });

            it('should bind this to the aspect instance', () => {
                advice = jasmine.createSpy('advice').and.callFake(function () {
                    expect(this).toEqual(jasmine.any(aspectClass));
                });

                const labels = a.labels;

                expect(advice).toHaveBeenCalled();
            });

            it('should call the aspect', () => {
                expect(advice).not.toHaveBeenCalled();
                const labels = a.labels;
                expect(advice).toHaveBeenCalled();
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
                    weaver.enable(new PropAspect());

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
            advice = jasmine.createSpy('advice').and.callFake(function (ctxt) {
                return ctxt.value;
            });
        });

        let a: Labeled;

        describe('that throws', () => {
            beforeEach(() => {
                @Aspect('PropAspect')
                class PropAspect {
                    @Compile(on.property.withAnnotations(AProperty))
                    compile() {
                        return {
                            set() {
                                throw new Error('expected');
                            },
                        };
                    }

                    @AfterReturn(on.property.setter.withAnnotations(AProperty))
                    after() {
                        advice(null, null);
                    }
                }
                weaver.enable(new PropAspect());

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
                expect(advice).not.toHaveBeenCalled();
            });
        });

        describe('that do not throws', () => {
            beforeEach(() => {
                @Aspect('PropAspect')
                class PropAspect {
                    @AfterReturn(on.property.setter.withAnnotations(AProperty))
                    after(ctxt: AdviceContext<any, any>, returnValue: any) {
                        return advice.bind(this)(ctxt, returnValue);
                    }
                }
                aspectClass = PropAspect;
                weaver.enable(new PropAspect());

                class A implements Labeled {
                    @AProperty()
                    labels: string[] = ['x'];
                }
                a = new A();

                advice = jasmine.createSpy('advice', function () {});
            });

            it('should bind this to the aspect instance', () => {
                advice = jasmine.createSpy('advice').and.callFake(function () {
                    expect(this).toEqual(jasmine.any(aspectClass));
                });

                a.labels = ['newValue'];

                expect(advice).toHaveBeenCalled();
            });

            it('should call the aspect', () => {
                expect(advice).not.toHaveBeenCalled();
                a.labels = ['newValue'];
                expect(advice).toHaveBeenCalled();
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
                    weaver.enable(new PropAspect());

                    class A implements Labeled {
                        @AProperty()
                        labels: string[];
                    }
                    a = new A();
                });

                it('should throw an error', () => {
                    expect(() => (a.labels = ['newValue'])).toThrow(
                        new Error(
                            '@AfterReturn(@AProperty) PropAspect.after(): Returning from advice is not supported',
                        ),
                    );
                });
            });
        });
    });

    describe('applied on a method', () => {
        beforeEach(() => {
            advice = jasmine.createSpy('advice').and.callFake(function (ctxt) {
                return ctxt.value;
            });

            @Aspect('MethodAspect')
            class MethodAspect {
                @AfterReturn(on.method.withAnnotations(AMethod))
                after(ctxt: AfterReturnContext<any, any>, returnValue: any) {
                    return advice(ctxt, returnValue);
                }
            }
            weaver.enable(new MethodAspect());
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
                expect(advice).not.toHaveBeenCalled();
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

                advice = jasmine.createSpy('advice').and.callFake(function (ctxt, _returnValue) {
                    returnValue = _returnValue;
                    return ctxt.value.concat('afterReturn');
                });
            });

            it('should call the aspect', () => {
                expect(advice).not.toHaveBeenCalled();
                a.addLabel('newValue');
                expect(advice).toHaveBeenCalled();
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
    xdescribe('applied on a method parameter', () => {
        describe('that throws', () => {
            it('should not call the aspect', () => {});
        });

        describe('that do not throws', () => {
            it('should call the aspect', () => {});

            it('should return the new value', () => {});

            it('should pass to advice the original returned value as 2nd parameter', () => {});
        });
    });
});
