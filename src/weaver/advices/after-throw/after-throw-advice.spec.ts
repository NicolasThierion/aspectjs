import { AdviceContext, AfterThrowContext, CompileContext } from '../advice-context';
import { AClass } from '../../../tests/a';
import { AfterThrow } from './after-throw.decorator';
import { on } from '../pointcut';
import { AProperty, Labeled, setupWeaver } from '../../../tests/helpers';
import Spy = jasmine.Spy;
import { Compile } from '../compile/compile.decorator';
import { Mutable } from '../../../utils';
import { WeavingError } from '../../weaving-error';
import { Aspect } from '../aspect';
import { AnnotationType } from '../../..';

const thrownError = new Error('expected');

describe('@AfterThrow advice', () => {
    let afterThrowAdvice: Spy;
    let adviceError: Error;
    beforeEach(() => {
        afterThrowAdvice = jasmine.createSpy('afterThrowAdvice', function() {}).and.callThrough();
        adviceError = undefined;
    });

    describe('configured on some class', () => {
        beforeEach(() => {
            @Aspect('AClassLabel')
            class AfterThrowAspect {
                @AfterThrow(on.class.annotations(AClass))
                apply(ctxt: AfterThrowContext<any, AnnotationType.CLASS>, error: Error): void {
                    expect(this).toEqual(jasmine.any(AfterThrowAspect));

                    expect(error).toEqual(ctxt.error);
                    adviceError = error;

                    return afterThrowAdvice(ctxt, error);
                }
            }

            setupWeaver(new AfterThrowAspect());
        });

        describe('when an instance of this class is created', () => {
            describe('with a constructor that throws', () => {
                let A: any;
                beforeEach(() => {
                    afterThrowAdvice = jasmine
                        .createSpy('afterThrowAdvice', function(
                            ctxt: AfterThrowContext<Labeled, AnnotationType.CLASS>,
                            error: Error,
                        ) {
                            ctxt.instance.labels = ctxt.instance.labels ?? [];
                            ctxt.instance.labels.push('A');

                            throw ctxt.error;
                        })
                        .and.callThrough();

                    @AClass()
                    // eslint-disable-next-line @typescript-eslint/class-name-casing
                    class A_ implements Labeled {
                        public labels: string[];
                        constructor(label: string) {
                            this.labels = [label];
                            throw new Error('expected');
                        }
                    }
                    A = A_;
                });

                it('should call the aspect', () => {
                    expect(() => {
                        new A('ctor');
                    }).toThrow();
                    expect(afterThrowAdvice).toHaveBeenCalled();
                });

                it('should pass the error as 2nd parameter of advice', () => {
                    try {
                        new A('ctor');
                    } catch (e) {}
                    expect(adviceError).toEqual(thrownError);
                    expect(afterThrowAdvice).toHaveBeenCalled();
                });

                describe('when the aspect swallows the exception', () => {
                    beforeEach(() => {
                        afterThrowAdvice = jasmine
                            .createSpy('afterThrowAdvice', (ctxt: AfterThrowContext<Labeled, AnnotationType.CLASS>) => {
                                ctxt.instance.labels = ctxt.instance.labels ?? [];
                                ctxt.instance.labels.push('A');
                            })
                            .and.callThrough();
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
                        expect(afterThrowAdvice).toHaveBeenCalled();
                        expect(labels).toEqual(['A']);
                    });
                });
            });

            describe('and the aspect returns a new value', () => {
                beforeEach(() => {
                    afterThrowAdvice = jasmine
                        .createSpy('afterThrowAdvice', (ctxt: AdviceContext<Labeled, AnnotationType.CLASS>) => {
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

                    expect(afterThrowAdvice).not.toHaveBeenCalled();
                });
            });
        });
    });

    describe('applied on a property', () => {
        @Aspect('PropertyThrow')
        class PropertyThrowAspect {
            @Compile(on.property.annotations(AProperty))
            compile(ctxt: CompileContext<any, AnnotationType.PROPERTY>): PropertyDescriptor {
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
            @AfterThrow(on.property.annotations(AProperty))
            afterThrow(ctxt: AfterThrowContext<any, AnnotationType.PROPERTY>, error: Error): void {
                afterThrowAdvice(ctxt, error);
                return Reflect.getOwnMetadata(ctxt.target.propertyKey, ctxt.instance);
            }
        }

        let a: Labeled;

        describe('getting this property', () => {
            describe('with a descriptor that do not throws', () => {
                beforeEach(() => {
                    setupWeaver(new AfterThrowAspect());

                    class A implements Labeled {
                        @AProperty()
                        public labels: string[] = [];
                    }

                    a = new A();
                });

                it('should not call the aspect', () => {
                    const labels = a.labels;
                    expect(afterThrowAdvice).not.toHaveBeenCalled();
                });

                it('should return the original value', () => {
                    expect(a.labels).toEqual([]);
                });
            });

            describe('with a descriptor that throws', () => {
                beforeEach(() => {
                    setupWeaver(new AfterThrowAspect(), new PropertyThrowAspect());

                    class A implements Labeled {
                        @AProperty()
                        public labels: string[] = [];
                    }

                    a = new A();

                    afterThrowAdvice = jasmine.createSpy(
                        'afterThrowAdviceSpy',
                        (ctxt: AfterThrowContext<any, any>, error: Error) => {},
                    );
                });

                it('should call the aspect', () => {
                    try {
                        console.log(a.labels);
                    } catch (e) {}
                    expect(afterThrowAdvice).toHaveBeenCalled();
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
                        @AfterThrow(on.property.annotations(AProperty))
                        afterThrow(ctxt: AfterThrowContext<any, AnnotationType.PROPERTY>, error: Error): any {
                            return ['newValue'];
                        }
                    }

                    setupWeaver(new PropertyThrowAspect(), new ReturnNewValueAspect());

                    class A implements Labeled {
                        @AProperty()
                        public labels: string[];
                    }
                    const a = new A();
                    expect(a.labels).toEqual(['newValue']);
                });
            });

            describe('and the aspect set a new ctxt.value', () => {
                xit('should throw an error', () => {
                    @Aspect('APropertyLabel')
                    class ReturnNewValueAspect {
                        @AfterThrow(on.property.annotations(AProperty))
                        afterThrow(ctxt: AfterThrowContext<any, AnnotationType.PROPERTY>, error: Error): void {
                            (ctxt as Mutable<AfterThrowContext<any, AnnotationType.PROPERTY>>).value = ['newValue'];
                        }
                    }

                    setupWeaver(new PropertyThrowAspect(), new ReturnNewValueAspect());

                    class A implements Labeled {
                        @AProperty()
                        public labels: string[];
                    }
                    const a = new A();
                    expect(() => a.labels).toThrow();
                });
            });

            describe('and the aspect do not return a value', () => {
                it('should throw an error', () => {
                    @Aspect('APropertyLabel')
                    class ReturnNewValueAspect {
                        @AfterThrow(on.property.annotations(AProperty))
                        afterThrow(ctxt: AfterThrowContext<any, AnnotationType.PROPERTY>, error: Error): void {}
                    }

                    setupWeaver(new PropertyThrowAspect(), new ReturnNewValueAspect());

                    class A implements Labeled {
                        @AProperty()
                        public labels: string[];
                    }
                    const a = new A();
                    expect(a.labels).toEqual(undefined);
                });
            });
        });
    });

    describe('applied on a property setter', () => {
        @Aspect('PropertyThrow')
        class PropertyThrowAspect {
            @Compile(on.property.annotations(AProperty))
            compile(ctxt: CompileContext<any, AnnotationType.PROPERTY>): PropertyDescriptor {
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
            @AfterThrow(on.property.setter.annotations(AProperty))
            afterThrow(ctxt: AfterThrowContext<any, AnnotationType.PROPERTY>, error: Error): void {
                afterThrowAdvice(ctxt, error);
                return Reflect.getOwnMetadata(ctxt.target.propertyKey, ctxt.instance);
            }
        }

        let a: Labeled;

        describe('setting this property', () => {
            describe('with a descriptor that do not throws', () => {
                beforeEach(() => {
                    setupWeaver(new AfterThrowAspect());

                    class A implements Labeled {
                        @AProperty()
                        public labels: string[];
                    }

                    a = new A();
                });

                it('should not call the aspect', () => {
                    a.labels = [];
                    expect(afterThrowAdvice).not.toHaveBeenCalled();
                });

                it('should assign the value', () => {
                    a.labels = ['newValue'];
                    expect(a.labels).toEqual(['newValue']);
                });
            });

            describe('with a descriptor that throws', () => {
                beforeEach(() => {
                    setupWeaver(new AfterThrowAspect(), new PropertyThrowAspect());

                    class A implements Labeled {
                        @AProperty()
                        public labels: string[];
                    }

                    a = new A();

                    afterThrowAdvice = jasmine
                        .createSpy('afterThrowAdviceSpy', (ctxt: AfterThrowContext<any, any>, error: Error) => {
                            adviceError = error;
                        })
                        .and.callThrough();
                });

                it('should call the aspect', () => {
                    try {
                        a.labels = [];
                    } catch (e) {}
                    expect(afterThrowAdvice).toHaveBeenCalled();
                });

                it('should pass the error as 2nd parameter of advice', () => {
                    try {
                        a.labels = [];
                    } catch (e) {}
                    expect(adviceError).toEqual(thrownError);
                    expect(afterThrowAdvice).toHaveBeenCalled();
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
                        @AfterThrow(on.property.setter.annotations(AProperty))
                        afterThrow(ctxt: AfterThrowContext<any, AnnotationType.PROPERTY>, error: Error): any {
                            return ['newValue'];
                        }
                    }

                    setupWeaver(new PropertyThrowAspect(), new ReturnNewValueAspect());

                    class A implements Labeled {
                        @AProperty()
                        public labels: string[];
                    }
                    const a = new A();
                    expect(() => {
                        a.labels = [];
                    }).toThrow(
                        new WeavingError(
                            'Returning from advice "@AfterThrow(@AProperty) ReturnNewValueAspect.afterThrow()" is not supported',
                        ),
                    );
                });
            });

            describe('and the aspect set a new ctxt.value', () => {
                xit('should throw an error', () => {
                    @Aspect('APropertyLabel')
                    class ReturnNewValueAspect {
                        @AfterThrow(on.property.annotations(AProperty))
                        afterThrow(ctxt: AfterThrowContext<any, AnnotationType.PROPERTY>, error: Error): void {
                            (ctxt as Mutable<AfterThrowContext<any, AnnotationType.PROPERTY>>).value = ['newValue'];
                        }
                    }

                    setupWeaver(new PropertyThrowAspect(), new ReturnNewValueAspect());

                    class A implements Labeled {
                        @AProperty()
                        public labels: string[];
                    }
                    const a = new A();
                    expect(() => a.labels).toThrow();
                });
            });

            describe('and the aspect do not return a value', () => {
                it('should throw an error', () => {
                    @Aspect('APropertyLabel')
                    class ReturnNewValueAspect {
                        @AfterThrow(on.property.annotations(AProperty))
                        afterThrow(ctxt: AfterThrowContext<any, AnnotationType.PROPERTY>, error: Error): void {}
                    }

                    setupWeaver(new PropertyThrowAspect(), new ReturnNewValueAspect());

                    class A implements Labeled {
                        @AProperty()
                        public labels: string[];
                    }
                    const a = new A();
                    expect(a.labels).toEqual(undefined);
                });
            });
        });
    });
});
