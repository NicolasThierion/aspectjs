import { Compile } from './compile.decorator';
import { AdviceContext, CompileContext } from '../advice-context';
import { on } from '../pointcut';
import {
    AClass,
    AMethod,
    AParameter,
    AProperty,
    BClass,
    BMethod,
    BProperty,
    Labeled,
    setupWeaver,
} from '../../../../tests/helpers';
import { WeavingError } from '../../weaving-error';
import { Aspect } from '../aspect';
import { AnnotationTarget } from '../../../annotation/target/annotation-target';
import { AnnotationContext } from '../../../annotation/context/context';
import { AnnotationRef, AnnotationType } from '../../../annotation/annotation.types';

let compileAspectA = jasmine.createSpy('compileAspectA');
let compileAspectB = jasmine.createSpy('compileAspectB');

describe('@Compile advice', () => {
    let target: AnnotationTarget<any, AnnotationType>;
    let instance: any;

    describe('applied on a class', () => {
        compileAspectA = jasmine.createSpy('compileAspectA');
        compileAspectB = jasmine.createSpy('compileAspectB');

        beforeEach(() => {
            @Aspect('AClassLabel')
            class CompileAspectA {
                @Compile(on.class.withAnnotations(AClass))
                apply(ctxt: AdviceContext<any, AnnotationType.CLASS>): any {
                    expect(this).toEqual(jasmine.any(CompileAspectA));

                    return compileAspectA(ctxt);
                }
            }

            @Aspect('BClassLabel')
            class CompileAspectB {
                @Compile(on.class.withAnnotations(BClass))
                apply(ctxt: AdviceContext<any, AnnotationType.CLASS>): any {
                    expect(this).toEqual(jasmine.any(CompileAspectB));

                    return compileAspectB(ctxt);
                }
            }

            compileAspectA = jasmine
                .createSpy('compileAdvice', function(ctxt: AdviceContext<any, AnnotationType.CLASS>) {
                    target = ctxt.target;
                    instance = (ctxt as any).instance;
                })
                .and.callThrough();

            setupWeaver(new CompileAspectA(), new CompileAspectB());
        });

        it('should call the aspect upon compilation of annotated class', () => {
            @AClass()
            class A {}

            expect(compileAspectA).toHaveBeenCalled();
        });

        it('should pass annotation target', () => {
            @AClass()
            class A {}

            expect(target).toBeDefined();
            expect(target.proto.constructor.name).toEqual(A.name);
        });

        it('should not pass context instance', () => {
            @AClass()
            class A {}

            expect(instance).toBeUndefined();
        });

        describe('when the advice returns a new constructor', () => {
            let ctor: Function;
            beforeEach(() => {
                ctor = jasmine.createSpy('ctor');
                compileAspectA = jasmine
                    .createSpy('compileAdvice', function(ctxt: AdviceContext<any, AnnotationType.CLASS>) {
                        target = ctxt.target;
                        instance = (ctxt as any).instance;

                        return function() {
                            ctor();
                            this.labels = ['replacedCtor'];
                        };
                    })
                    .and.callThrough();
            });
            it('should use the new constructor', () => {
                @AClass()
                class A implements Labeled {
                    labels?: string[];
                }

                const a = new A();
                expect(ctor).toHaveBeenCalled();
                expect(a.labels).toEqual(['replacedCtor']);
            });
        });

        describe('when the advice does not return a new constructor', () => {
            beforeEach(() => {
                compileAspectA = jasmine.createSpy('compileAdvice');
            });
            it('should use the new constructor', () => {
                @AClass()
                class A implements Labeled {
                    labels?: string[];
                }

                const a = new A();
                expect(Reflect.getPrototypeOf(a).constructor).toEqual(A);
            });
        });

        describe('when multiple @Compile are applied', () => {
            it('should call the two advices', () => {
                @BClass()
                @AClass()
                class AB {}

                new AB();
                expect(compileAspectA).toHaveBeenCalled();
                expect(compileAspectB).toHaveBeenCalled();
            });
        });
    });

    describe('applied on a property', () => {
        beforeEach(() => {
            @Aspect('APropertyLabel')
            class CompileAspectA {
                @Compile(on.property.withAnnotations(AProperty))
                apply(ctxt: AdviceContext<any, AnnotationType.PROPERTY>): any {
                    expect(this).toEqual(jasmine.any(CompileAspectA));

                    return compileAspectA(ctxt);
                }
            }

            @Aspect('BPropertyLabel')
            class CompileAspectB {
                @Compile(on.property.withAnnotations(BProperty))
                apply(ctxt: AdviceContext<any, AnnotationType.PROPERTY>): any {
                    expect(this).toEqual(jasmine.any(CompileAspectB));

                    return compileAspectB(ctxt);
                }
            }

            compileAspectA = jasmine
                .createSpy('compileAdvice', function(ctxt: AdviceContext<any, AnnotationType.PROPERTY>) {
                    target = ctxt.target;
                    instance = (ctxt as any).instance;
                })
                .and.callThrough();

            setupWeaver(new CompileAspectA(), new CompileAspectB());
        });

        it('should call the aspect upon compilation of annotated property', () => {
            class A {
                @AProperty()
                labels: string[];
            }
            expect(compileAspectA).toHaveBeenCalled();
        });

        it('should pass advice target', () => {
            class A {
                @AProperty()
                labels: string[];
            }
            expect(target).toBeDefined();
            expect(target.proto.constructor.name).toEqual(A.name);
        });

        it('should not pass context instance', () => {
            class A {
                @AProperty()
                labels: string[];
            }
            expect(instance).toBeUndefined();
        });

        describe('when the advice returns a new property descriptor', () => {
            describe('and the descriptor is invalid', () => {
                beforeEach(() => {
                    compileAspectA = jasmine
                        .createSpy('compileAdvice', function(ctxt: AdviceContext<any, AnnotationType.PROPERTY>) {
                            return ({
                                get: '',
                            } as any) as PropertyDescriptor;
                        })
                        .and.callThrough();
                });

                it('should throw an error', () => {
                    expect(() => {
                        class X {
                            @AProperty()
                            labels: string[];
                        }
                    }).toThrow(new TypeError('Getter must be a function: '));
                });
            });

            describe('that sets "value = any"', () => {
                let a: Labeled;
                beforeEach(() => {
                    compileAspectA = jasmine
                        .createSpy('compileAdvice', function(ctxt: AdviceContext<any, AnnotationType.PROPERTY>) {
                            return {
                                value: ['propAspect'],
                            };
                        })
                        .and.callThrough();
                    class A implements Labeled {
                        @AProperty()
                        labels?: string[];
                    }
                    a = new A();
                });
                it('should use the new property', () => {
                    expect(a.labels).toEqual(['propAspect']);
                });

                it('should disallow setting the value', () => {
                    expect(() => {
                        a.labels = [];
                    }).toThrow(new Error('Cannot set property labels of #<A> which has only a getter'));
                });
            });

            describe('that sets "get = () => any"', () => {
                let a: Labeled;

                beforeEach(() => {
                    compileAspectA = jasmine
                        .createSpy('compileAdvice', function(ctxt: AdviceContext<any, AnnotationType.PROPERTY>) {
                            return {
                                get: () => ['propAspect'],
                            };
                        })
                        .and.callThrough();

                    class A implements Labeled {
                        @AProperty()
                        labels?: string[];
                    }
                    a = new A();
                });
                it('should use the new property', () => {
                    expect(a.labels).toEqual(['propAspect']);
                });

                it('should disallow setting the value', () => {
                    expect(() => {
                        a.labels = [];
                    }).toThrow(new Error('Cannot set property labels of #<A> which has only a getter'));
                });
            });

            describe('that sets "get = () => any" along with set = () => any', () => {
                let a: Labeled;
                let val: string[];
                beforeEach(() => {
                    val = ['propAspect'];

                    compileAspectA = jasmine
                        .createSpy('compileAdvice', function(ctxt: AdviceContext<any, AnnotationType.PROPERTY>) {
                            return {
                                get: () => val,
                                set: (_val: any) => (val = _val),
                            };
                        })
                        .and.callThrough();

                    class A implements Labeled {
                        @AProperty()
                        labels?: string[];
                    }

                    a = new A();
                });

                it('should allow getting the property', () => {
                    expect(a.labels).toEqual(val);
                });

                describe('getting the property', () => {
                    it('should call through the getter', () => {
                        expect(a.labels).toEqual(val);
                    });
                });

                describe('setting the property', () => {
                    it('should call through the setter', () => {
                        a.labels = ['newProp'];
                        expect(val).toEqual(['newProp']);
                    });
                });

                it('should allow setting the property', () => {
                    a.labels = ['newProp'];
                    expect(a.labels).toEqual(['newProp']);
                });
            });
        });

        describe('when multiple @Compile are applied', () => {
            it('should call the two advices', () => {
                class AB {
                    @BProperty()
                    @AProperty()
                    private prop: string;
                }

                new AB();
                expect(compileAspectA).toHaveBeenCalled();
                expect(compileAspectB).toHaveBeenCalled();
            });
        });
    });

    describe('applied on a property setter', () => {
        it('should throw an error', () => {
            expect(() => {
                @Aspect('BadAspect')
                class BadAspect {
                    @Compile(on.property.setter.withAnnotations(AProperty))
                    apply() {}
                }
            }).toThrow(
                new WeavingError(
                    'Advice "@Compile(@AProperty) BadAspect.apply()" cannot be applied on property setter',
                ),
            );
        });
    });

    describe('applied on a method', () => {
        let annotation: AnnotationRef;
        let target: AnnotationTarget<unknown, AnnotationType.METHOD>;

        beforeEach(() => {
            @Aspect()
            class CompileAspectA {
                @Compile(on.method.withAnnotations(AMethod))
                compileMethod(ctxt: CompileContext<Labeled, AnnotationType.METHOD>) {
                    return compileAspectA(ctxt);
                }
            }

            @Aspect()
            class CompileAspectB {
                @Compile(on.method.withAnnotations(BMethod))
                compileMethod(ctxt: CompileContext<Labeled, AnnotationType.METHOD>) {
                    return compileAspectB(ctxt);
                }
            }

            compileAspectA = jasmine
                .createSpy('compileAdvice', function(ctxt: CompileContext<Labeled, AnnotationType.METHOD>) {
                    target = ctxt.target;
                    instance = (ctxt as any).instance;
                    annotation = ctxt.annotation;
                })
                .and.callThrough();

            setupWeaver(new CompileAspectA(), new CompileAspectB());
        });

        it('should call the aspect upon compilation of annotated method', () => {
            class A {
                @AMethod()
                addLabel(): void {}
            }

            expect(compileAspectA).toHaveBeenCalled();
        });

        it('should pass annotation target', () => {
            class A {
                @AMethod()
                addLabel(): void {}
            }

            expect(target).toBeDefined();
            expect(target.proto.constructor.name).toEqual(A.name);
        });

        it('should not pass context instance', () => {
            class A {
                @AMethod()
                addLabel(): void {}
            }

            expect(instance).toBeUndefined();
        });

        describe('when the advice returns a new property descriptor', () => {
            describe('and the descriptor is valid', () => {
                beforeEach(() => {
                    compileAspectA = jasmine
                        .createSpy('compileAdvice', function(ctxt: AdviceContext<any, AnnotationType.CLASS>) {
                            const descriptor = {
                                ...Reflect.getOwnPropertyDescriptor(ctxt.target.proto, ctxt.target.propertyKey),
                            };
                            descriptor.value = function() {
                                this.labels = ['methodAdvice'];
                            };
                            return descriptor;
                        })
                        .and.callThrough();
                });
                it('should use the new method descriptor', () => {
                    class A implements Labeled {
                        labels: string[] = [];

                        @AMethod()
                        addLabel() {}
                    }

                    const a = new A();
                    expect(a.labels).toEqual([]);
                    a.addLabel();
                    expect(a.labels).toEqual(['methodAdvice']);
                });
            });

            describe('and the descriptor is invalid', () => {
                beforeEach(() => {
                    compileAspectA = jasmine
                        .createSpy('compileAdvice', function() {
                            return {
                                value: () => {},
                                get: () => {},
                            };
                        })
                        .and.callThrough();
                });

                it('should throw an error', () => {
                    expect(() => {
                        class A {
                            @AMethod()
                            addLabel() {}
                        }
                    }).toThrow(
                        new TypeError(
                            'Invalid property descriptor. Cannot both specify accessors and a value or writable attribute, #<Object>',
                        ),
                    );
                });
            });

            describe('and the descriptor is not a method descriptor', () => {
                beforeEach(() => {
                    compileAspectA = jasmine
                        .createSpy('compileAdvice', function() {
                            return {};
                        })
                        .and.callThrough();
                });

                it('should throw an error', () => {
                    expect(() => {
                        class A {
                            @AMethod()
                            addLabel() {}
                        }
                    }).toThrow(
                        new WeavingError(
                            'Expected @Compile(@AMethod) CompileAspectA.compileMethod() to return a method descriptor. Got: undefined',
                        ),
                    );
                });
            });
        });
        describe('when multiple @Compile are applied', () => {
            it('should call the two advices', () => {
                class AB {
                    @BMethod()
                    @AMethod()
                    private someMethod(ctxt: CompileContext<any, any>): any {
                        return ctxt.target.descriptor;
                    }
                }

                new AB();
                expect(compileAspectA).toHaveBeenCalled();
                expect(compileAspectB).toHaveBeenCalled();
            });
        });
    });
    describe('applied on a method parameter', () => {
        let annotation: AnnotationContext<any, any>;
        let target: AnnotationTarget<unknown, AnnotationType.PARAMETER>;

        beforeEach(() => {
            @Aspect()
            class CompileAspect {
                @Compile(on.parameter.withAnnotations(AParameter))
                compileParameter(ctxt: CompileContext<Labeled, AnnotationType.PARAMETER>) {
                    return compileAspectA(ctxt);
                }
            }

            compileAspectA = jasmine
                .createSpy('compileAdvice', function(ctxt: CompileContext<Labeled, AnnotationType.PARAMETER>) {
                    target = ctxt.target;
                    instance = (ctxt as any).instance;
                    annotation = ctxt.annotation;
                })
                .and.callThrough();

            setupWeaver(new CompileAspect());
        });

        it('should call the aspect upon compilation of annotated parameter', () => {
            class A {
                addLabel(@AParameter() labels: string[]): void {}
            }

            expect(compileAspectA).toHaveBeenCalled();
        });

        it('should pass annotation target', () => {
            class A {
                addLabel(@AParameter('parameterLabel') labels: string[]): void {}
            }

            expect(target).toBeDefined();
            expect(target.proto.constructor.name).toEqual(A.name);
            expect(target.parameterIndex).toEqual(0);
            expect(annotation.args).toEqual(['parameterLabel']);
        });

        it('should not pass context instance', () => {
            class A {
                addLabel(@AParameter('parameterLabel') labels: string[]): void {}
            }
            expect(target).toBeDefined();
            expect(instance).toBeUndefined();
        });
    });
});
