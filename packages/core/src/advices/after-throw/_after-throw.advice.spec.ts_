import { AfterThrow, Aspect, Compile } from '@aspectjs/core/annotations';
import { Weaver } from '@aspectjs/weaver';
import { setupAspectTestingContext } from '@aspectjs/core/testing';
import { _AClass, _AMethod, _AProperty, _Labeled } from '@root/testing';

import Spy = jasmine.Spy;
import { AfterThrowContext } from './after-throw.context';
import { AdviceType } from '../../advice/advice.type';
import { on } from '../../advice/pointcut';
import { AdviceContext, CompileContext } from '../../advice/advice.context.type';

const thrownError = new Error('expected');

describe('@AfterThrow advice', () => {
    let advice: Spy;
    let adviceError: Error;
    let aspectClass: any;
    let weaver: Weaver;
    beforeEach(() => {
        advice = jasmine.createSpy('advice', function () {}).and.callThrough();
        adviceError = undefined;
        weaver = setupAspectTestingContext().weaverContext.getWeaver();
    });

    describe('configured on some class', () => {
        beforeEach(() => {
            @Aspect('AClassLabel')
            class AfterThrowAspect {
                @AfterThrow(on.class.withAnnotations(_AClass))
                apply(ctxt: AfterThrowContext<any, AdviceType.CLASS>, error: Error): void {
                    expect(error).toEqual(ctxt.error);
                    adviceError = error;

                    return advice.bind(this)(ctxt, error);
                }
            }
            aspectClass = AfterThrowAspect;
            weaver.enable(new AfterThrowAspect());
        });

        describe('when an instance of this class is created', () => {
            describe('with a constructor that throws', () => {
                let A: any;
                beforeEach(() => {
                    advice = jasmine
                        .createSpy('afterThrowAdvice')
                        .and.callFake(function (ctxt: AfterThrowContext<_Labeled, AdviceType.CLASS>, error: Error) {
                            ctxt.instance.labels = ctxt.instance.labels ?? [];
                            ctxt.instance.labels.push('A');

                            throw ctxt.error;
                        });

                    @_AClass()
                    class A_ implements _Labeled {
                        public labels: string[];

                        constructor(label: string) {
                            this.labels = [label];
                            throw new Error('expected');
                        }
                    }

                    A = A_;
                });

                it('should bind this to the aspect instance', () => {
                    advice = jasmine.createSpy('advice').and.callFake(function () {
                        expect(this).toEqual(jasmine.any(aspectClass));
                    });

                    try {
                        new A('ctor');
                    } catch (e) {}
                    expect(advice).toHaveBeenCalled();
                });

                it('should call the aspect', () => {
                    expect(() => {
                        new A('ctor');
                    }).toThrow();
                    expect(advice).toHaveBeenCalled();
                });

                it('should pass the error as 2nd parameter of advice', () => {
                    try {
                        new A('ctor');
                    } catch (e) {}
                    expect(adviceError).toEqual(thrownError);
                    expect(advice).toHaveBeenCalled();
                });

                describe('when the aspect swallows the exception', () => {
                    beforeEach(() => {
                        advice = jasmine
                            .createSpy('afterThrowAdvice')
                            .and.callFake((ctxt: AfterThrowContext<_Labeled, AdviceType.CLASS>) => {
                                ctxt.instance.labels = ctxt.instance.labels ?? [];
                                ctxt.instance.labels.push('A');
                            });
                    });

                    it('should not throw', () => {
                        @_AClass()
                        class A implements _Labeled {
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
                        expect(advice).toHaveBeenCalled();
                        expect(labels).toEqual(['A']);
                    });
                });
            });

            describe('and the aspect returns a new value', () => {
                beforeEach(() => {
                    advice = jasmine
                        .createSpy('afterThrowAdvice')
                        .and.callFake((ctxt: AdviceContext<_Labeled, AdviceType.CLASS>) => {
                            return Object.assign(Object.create(ctxt.target.proto), {
                                labels: ['ABis'],
                            });
                        });
                });

                it('should assign "this" instance to the returned value', () => {
                    @_AClass()
                    class A implements _Labeled {
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
                    @_AClass()
                    class A implements _Labeled {
                        public labels: string[];

                        constructor(label: string) {
                            this.labels = [label];
                        }
                    }

                    expect(advice).not.toHaveBeenCalled();
                });
            });
        });
    });

    describe('applied on a property', () => {
        let _PropertyThrowAspect: any;
        let _AfterThrowAspect: any;
        beforeEach(() => {
            @Aspect('PropertyThrow')
            class PropertyThrowAspect {
                @Compile(on.property.withAnnotations(_AProperty))
                compile(ctxt: CompileContext<any, AdviceType.PROPERTY>): PropertyDescriptor {
                    return {
                        get() {
                            throw new Error('expected');
                        },
                        set(val) {
                            Reflect.defineMetadata(ctxt.target.propertyKey, val, this);
                        },
                    };
                }
            }

            @Aspect('APropertyLabel')
            class AfterThrowAspect {
                @AfterThrow(on.property.withAnnotations(_AProperty))
                afterThrow(ctxt: AfterThrowContext<any, AdviceType.PROPERTY>, error: Error): void {
                    advice(ctxt, error);
                    return Reflect.getOwnMetadata(ctxt.target.propertyKey, ctxt.instance);
                }
            }

            _PropertyThrowAspect = PropertyThrowAspect;
            _AfterThrowAspect = AfterThrowAspect;
        });
        let a: _Labeled;

        describe('getting this property', () => {
            describe('with a descriptor that do not throws', () => {
                beforeEach(() => {
                    weaver.enable(new _AfterThrowAspect());

                    class A implements _Labeled {
                        @_AProperty()
                        public labels: string[] = [];
                    }

                    a = new A();
                });

                it('should not call the aspect', () => {
                    const labels = a.labels;
                    expect(advice).not.toHaveBeenCalled();
                });

                it('should return the original value', () => {
                    expect(a.labels).toEqual([]);
                });
            });

            describe('with a descriptor that throws', () => {
                beforeEach(() => {
                    weaver.enable(new _AfterThrowAspect(), new _PropertyThrowAspect());

                    class A implements _Labeled {
                        @_AProperty()
                        public labels: string[] = [];
                    }

                    a = new A();

                    advice = jasmine.createSpy(
                        'afterThrowAdviceSpy',
                        (ctxt: AfterThrowContext<any, any>, error: Error) => {},
                    );
                });

                it('should call the aspect', () => {
                    try {
                        console.log(a.labels);
                    } catch (e) {}
                    expect(advice).toHaveBeenCalled();
                });

                describe('when the aspect swallows the exception', () => {
                    it('should not throw', () => {
                        expect(() => {
                            expect(a.labels).toEqual([]);
                        }).not.toThrow();
                    });
                });
            });

            describe('and the aspect returns a new value', () => {
                it('should use the returned value', () => {
                    @Aspect('APropertyLabel')
                    class ReturnNewValueAspect {
                        @AfterThrow(on.property.withAnnotations(_AProperty))
                        afterThrow(ctxt: AfterThrowContext<any, AdviceType.PROPERTY>, error: Error): any {
                            return ['newValue'];
                        }
                    }

                    weaver.enable(new _PropertyThrowAspect(), new ReturnNewValueAspect());

                    class A implements _Labeled {
                        @_AProperty()
                        public labels: string[];
                    }

                    const a = new A();
                    expect(a.labels).toEqual(['newValue']);
                });
            });
        });
    });

    describe('applied on a property setter', () => {
        let _PropertyThrowAspect: any;
        let _AfterThrowAspect: any;
        beforeEach(() => {
            @Aspect('PropertyThrow')
            class PropertyThrowAspect {
                @Compile(on.property.withAnnotations(_AProperty))
                compile(ctxt: CompileContext<any, AdviceType.PROPERTY>): PropertyDescriptor {
                    return {
                        get() {
                            return this._val;
                        },
                        set(val) {
                            this._val = val;
                            throw thrownError;
                        },
                    };
                }
            }

            @Aspect('APropertyLabel')
            class AfterThrowAspect {
                @AfterThrow(on.property.setter.withAnnotations(_AProperty))
                afterThrow(ctxt: AfterThrowContext<any, AdviceType.PROPERTY>, error: Error): void {
                    advice(ctxt, error);
                    return Reflect.getOwnMetadata(ctxt.target.propertyKey, ctxt.instance);
                }
            }

            _PropertyThrowAspect = PropertyThrowAspect;
            _AfterThrowAspect = AfterThrowAspect;
        });

        let a: _Labeled;

        describe('setting this property', () => {
            describe('with a descriptor that do not throws', () => {
                beforeEach(() => {
                    weaver.enable(new _AfterThrowAspect());

                    class A implements _Labeled {
                        @_AProperty()
                        public labels: string[];
                    }

                    a = new A();
                });

                it('should not call the aspect', () => {
                    a.labels = [];
                    expect(advice).not.toHaveBeenCalled();
                });

                it('should assign the value', () => {
                    a.labels = ['newValue'];
                    expect(a.labels).toEqual(['newValue']);
                });
            });

            describe('with a descriptor that throws', () => {
                beforeEach(() => {
                    weaver.enable(new _AfterThrowAspect(), new _PropertyThrowAspect());

                    class A implements _Labeled {
                        @_AProperty()
                        public labels: string[];
                    }

                    a = new A();

                    advice = jasmine
                        .createSpy('afterThrowAdviceSpy')
                        .and.callFake((ctxt: AfterThrowContext<any, any>, error: Error) => {
                            adviceError = error;
                        });
                });

                it('should call the aspect', () => {
                    try {
                        a.labels = [];
                    } catch (e) {}
                    expect(advice).toHaveBeenCalled();
                });

                it('should pass the error as 2nd parameter of advice', () => {
                    try {
                        a.labels = [];
                    } catch (e) {}
                    expect(adviceError).toEqual(thrownError);
                    expect(advice).toHaveBeenCalled();
                });

                describe('when the aspect swallows the exception', () => {
                    it('should not throw', () => {
                        expect(() => {
                            a.labels = ['newValue'];
                        }).not.toThrow();

                        expect(a.labels).toEqual(['newValue']);
                    });
                });
            });

            describe('and the aspect returns a new value', () => {
                it('should throw an error', () => {
                    @Aspect('APropertyLabel')
                    class ReturnNewValueAspect {
                        @AfterThrow(on.property.setter.withAnnotations(_AProperty))
                        afterThrow(ctxt: AfterThrowContext<any, AdviceType.PROPERTY>, error: Error): any {
                            return ['newValue'];
                        }
                    }

                    weaver.enable(new _PropertyThrowAspect(), new ReturnNewValueAspect());

                    class A implements _Labeled {
                        @_AProperty()
                        public labels: string[];
                    }

                    const a = new A();
                    expect(() => {
                        a.labels = [];
                    }).toThrow(
                        new Error(
                            'Error applying advice @AfterThrow(@AProperty) ReturnNewValueAspect.afterThrow() on property "A.labels": Returning from advice is not supported',
                        ),
                    );
                });
            });
        });
    });

    describe('applied on a method', () => {
        let a: _Labeled;
        beforeEach(() => {
            @Aspect('AfterThrowAspect')
            class AfterThrowAspect {
                @AfterThrow(on.method.withAnnotations(_AMethod))
                afterThrow(ctxt: AfterThrowContext<any, AdviceType.METHOD>, error: Error): void {
                    return advice(ctxt, error);
                }
            }

            weaver.enable(new AfterThrowAspect());

            advice = jasmine
                .createSpy('afterThrowAdviceSpy')
                .and.callFake((ctxt: AfterThrowContext<any, any>, error: Error) => {
                    adviceError = error;
                });
        });

        describe('calling the method', () => {
            describe('when the method do not throws', () => {
                beforeEach(() => {
                    class A implements _Labeled {
                        public labels: string[];

                        @_AMethod()
                        addLabel() {}
                    }

                    a = new A();
                });

                it('should not call the aspect', () => {
                    a.addLabel();
                    expect(advice).not.toHaveBeenCalled();
                });
            });

            describe('when the method throws', () => {
                beforeEach(() => {
                    class A implements _Labeled {
                        public labels: string[];

                        @_AMethod()
                        addLabel(): string[] {
                            throw new Error('expected');
                        }
                    }

                    a = new A();
                });
                it('should call the aspect', () => {
                    expect(advice).not.toHaveBeenCalled();
                    try {
                        a.addLabel();
                    } catch (e) {}
                    expect(advice).toHaveBeenCalled();
                });

                it('should pass the error as 2nd parameter of advice', () => {
                    expect(adviceError).not.toEqual(thrownError);

                    try {
                        a.addLabel();
                    } catch (e) {}
                    expect(adviceError).toEqual(thrownError);
                });

                describe('and the aspect swallows the exception', () => {
                    it('should not throw', () => {
                        expect(() => {
                            a.addLabel();
                        }).not.toThrow();
                    });

                    it('should return the value returned by the aspect', () => {
                        advice = jasmine
                            .createSpy('afterThrowAdviceSpy')
                            .and.callFake((ctxt: AfterThrowContext<any, any>, error: Error) => {
                                return 'newValue';
                            });

                        expect(a.addLabel()).toEqual('newValue');
                    });
                });

                describe('and the aspect throws a new exception', () => {
                    beforeEach(() => {
                        advice = jasmine
                            .createSpy('afterThrowAdviceSpy')
                            .and.callFake((ctxt: AfterThrowContext<any, any>, error: Error) => {
                                throw new Error('new Error');
                            });
                    });
                    it('should throw the new error', () => {
                        expect(() => {
                            a.addLabel();
                        }).toThrow(new Error('new Error'));
                    });
                });
            });
        });
    });
    xdescribe('applied on a method parameter', () => {
        describe('calling the method', () => {
            describe('when the method do not throws', () => {
                it('should not call the aspect', () => {});
            });

            describe('when the method throws', () => {
                it('should call the aspect', () => {});

                it('should pass the error as 2nd parameter of advice', () => {});

                describe('and the aspect swallows the exception', () => {
                    it('should return the value returned by the aspect', () => {});

                    describe('and the aspect throws a new exception', () => {
                        it('should throw the new error', () => {});
                    });
                });
            });
        });
    });
});
