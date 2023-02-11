import { Aspect, Compile } from '@aspectjs/core/annotations';
import { _AClass, _AMethod, _AParameter, _AProperty, _BClass, _BMethod, _BProperty, _Labeled } from '@root/testing';

import { setupAspectTestingContext } from '@aspectjs/core/testing';
import { AdviceType } from '../../advice/advice.type';
import { AdviceTarget, AnnotationContext } from '@aspectjs/reflect/public_api';
import { Weaver, WeavingError } from '@aspectjs/weaver';
import { AdviceContext, CompileContext, on } from '../../..';

let advice = jasmine.createSpy('compileAspectA');
let compileAdviceB = jasmine.createSpy('compileAspectB');

describe('@Compile advice', () => {
    let target: AdviceTarget<any, AdviceType>;
    let instance: any;
    let aspectClass: any;
    let weaver: Weaver;

    beforeEach(() => {
        weaver = setupAspectTestingContext().weaverContext.getWeaver();
    });
    describe('applied on a class', () => {
        advice = jasmine.createSpy('compileAspectA');
        compileAdviceB = jasmine.createSpy('compileAspectB');

        beforeEach(() => {
            @Aspect('AClassLabel')
            class CompileAspectA {
                @Compile(on.class.withAnnotations(_AClass))
                apply(ctxt: AdviceContext<any, AdviceType.CLASS>): any {
                    return advice.bind(this)(ctxt);
                }
            }
            aspectClass = CompileAspectA;

            @Aspect('BClassLabel')
            class CompileAspectB {
                @Compile(on.class.withAnnotations(_BClass))
                apply(ctxt: AdviceContext<any, AdviceType.CLASS>): any {
                    return compileAdviceB.bind(this)(ctxt);
                }
            }

            advice = jasmine
                .createSpy('compileAdvice')
                .and.callFake(function (ctxt: AdviceContext<any, AdviceType.CLASS>) {
                    target = ctxt.target;
                    instance = (ctxt as any).instance;
                });

            weaver.enable(new CompileAspectA(), new CompileAspectB());
        });

        it('should bind this to the aspect instance', () => {
            advice = jasmine.createSpy('advice').and.callFake(function () {
                expect(this).toEqual(jasmine.any(aspectClass));
            });
            @_AClass()
            class A {}

            expect(advice).toHaveBeenCalled();
        });

        it('should call the aspect upon compilation of annotated class', () => {
            @_AClass()
            class A {}

            expect(advice).toHaveBeenCalled();
        });

        it('should pass annotation target', () => {
            @_AClass()
            class A {}

            expect(target).toBeDefined();
            expect(target.proto.constructor.name).toEqual(A.name);
        });

        it('should not pass context instance', () => {
            @_AClass()
            class A {}

            expect(instance).toBeUndefined();
        });

        describe('when the advice returns a new constructor', () => {
            let ctor: Function;
            beforeEach(() => {
                ctor = jasmine.createSpy('ctor');
                advice = jasmine
                    .createSpy('compileAdvice')
                    .and.callFake(function (ctxt: AdviceContext<any, AdviceType.CLASS>) {
                        target = ctxt.target;
                        instance = (ctxt as any).instance;

                        return function () {
                            ctor();
                            this.labels = ['replacedCtor'];
                        };
                    });
            });
            it('should use the new constructor', () => {
                @_AClass()
                class A implements _Labeled {
                    labels?: string[];
                }

                const a = new A();
                expect(ctor).toHaveBeenCalled();
                expect(a.labels).toEqual(['replacedCtor']);
            });
        });

        describe('when the advice does not return a new constructor', () => {
            beforeEach(() => {
                advice = jasmine.createSpy('compileAdvice');
            });
            it('should use the new constructor', () => {
                @_AClass()
                class A implements _Labeled {
                    labels?: string[];
                }

                const a = new A();
                expect(Reflect.getPrototypeOf(a).constructor).toEqual(A);
            });
        });

        describe('when multiple @Compile are applied', () => {
            it('should call the two advices', () => {
                @_BClass()
                @_AClass()
                class AB {}

                new AB();
                expect(advice).toHaveBeenCalled();
                expect(compileAdviceB).toHaveBeenCalled();
            });
        });
    });

    describe('applied on a property', () => {
        beforeEach(() => {
            @Aspect('APropertyLabel')
            class CompileAspectA {
                @Compile(on.property.withAnnotations(_AProperty))
                apply(ctxt: AdviceContext<any, AdviceType.PROPERTY>): any {
                    return advice.bind(this)(ctxt);
                }
            }
            aspectClass = CompileAspectA;
            @Aspect('BPropertyLabel')
            class CompileAspectB {
                @Compile(on.property.withAnnotations(_BProperty))
                apply(ctxt: AdviceContext<any, AdviceType.PROPERTY>): any {
                    return compileAdviceB.bind(this)(ctxt);
                }
            }

            advice = jasmine
                .createSpy('compileAdvice')
                .and.callFake(function (ctxt: AdviceContext<any, AdviceType.PROPERTY>) {
                    target = ctxt.target;
                    instance = (ctxt as any).instance;
                });

            weaver.enable(new CompileAspectA(), new CompileAspectB());
        });

        it('should bind this to the aspect instance', () => {
            advice = jasmine.createSpy('advice').and.callFake(function () {
                expect(this).toEqual(jasmine.any(aspectClass));
            });
            class A {
                @_AProperty()
                labels: string[];
            }

            expect(advice).toHaveBeenCalled();
        });

        it('should call the aspect upon compilation of annotated property', () => {
            class A {
                @_AProperty()
                labels: string[];
            }
            expect(advice).toHaveBeenCalled();
        });

        it('should pass advice target', () => {
            class A {
                @_AProperty()
                labels: string[];
            }
            expect(target).toBeDefined();
            expect(target.proto.constructor.name).toEqual(A.name);
        });

        it('should not pass context instance', () => {
            class A {
                @_AProperty()
                labels: string[];
            }
            expect(instance).toBeUndefined();
        });

        describe('when the advice returns a new property descriptor', () => {
            describe('and the descriptor is invalid', () => {
                beforeEach(() => {
                    advice = jasmine.createSpy('compileAdvice').and.callFake(() => ({
                        get: '',
                    }));
                });

                it('should throw an error', () => {
                    expect(() => {
                        class X {
                            @_AProperty()
                            labels: string[];
                        }
                    }).toThrow(new TypeError('Getter must be a function: '));
                });
            });

            describe('that sets "value = any"', () => {
                let a: _Labeled;
                beforeEach(() => {
                    advice = jasmine.createSpy('compileAdvice').and.callFake(() => ({
                        value: ['propAspect'],
                    }));
                    class A implements _Labeled {
                        @_AProperty()
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
                let a: _Labeled;

                beforeEach(() => {
                    advice = jasmine.createSpy('compileAdvice').and.callFake(() => ({
                        get: () => ['propAspect'],
                    }));

                    class A implements _Labeled {
                        @_AProperty()
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
                let a: _Labeled;
                let val: string[];
                beforeEach(() => {
                    val = ['propAspect'];

                    advice = jasmine.createSpy('compileAdvice').and.callFake(() => ({
                        get: () => val,
                        set: (_val: any) => (val = _val),
                    }));

                    class A implements _Labeled {
                        @_AProperty()
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
                    @_BProperty()
                    @_AProperty()
                    private prop: string;
                }

                new AB();
                expect(advice).toHaveBeenCalled();
                expect(compileAdviceB).toHaveBeenCalled();
            });
        });
    });

    describe('applied on a property setter', () => {
        it('should throw an error', () => {
            expect(() => {
                @Aspect('BadAspect')
                class BadAspect {
                    @Compile(on.property.setter.withAnnotations(_AProperty))
                    apply() {}
                }
                weaver.enable(BadAspect);
            }).toThrow(
                new WeavingError(
                    'Error applying advice @Compile(@AProperty) BadAspect.apply() on method "BadAspect.apply": Advice cannot be applied on property setter',
                ),
            );
        });
    });

    describe('applied on a method', () => {
        let target: AdviceTarget<unknown, AdviceType.METHOD>;

        beforeEach(() => {
            @Aspect()
            class CompileAspectA {
                @Compile(on.method.withAnnotations(_AMethod))
                compileMethod(ctxt: CompileContext<_Labeled, AdviceType.METHOD>) {
                    return advice(ctxt);
                }
            }

            @Aspect()
            class CompileAspectB {
                @Compile(on.method.withAnnotations(_BMethod))
                compileMethod(ctxt: CompileContext<_Labeled, AdviceType.METHOD>) {
                    return compileAdviceB(ctxt);
                }
            }

            advice = jasmine
                .createSpy('compileAdvice')
                .and.callFake(function (ctxt: CompileContext<_Labeled, AdviceType.METHOD>) {
                    target = ctxt.target;
                    instance = (ctxt as any).instance;
                });

            weaver.enable(new CompileAspectA(), new CompileAspectB());
        });

        it('should call the aspect upon compilation of annotated method', () => {
            class A {
                @_AMethod()
                addLabel(): void {}
            }

            expect(advice).toHaveBeenCalled();
        });

        it('should pass annotation target', () => {
            class A {
                @_AMethod()
                addLabel(): void {}
            }

            expect(target).toBeDefined();
            expect(target.proto.constructor.name).toEqual(A.name);
        });

        it('should not pass context instance', () => {
            class A {
                @_AMethod()
                addLabel(): void {}
            }

            expect(instance).toBeUndefined();
        });

        describe('when the advice returns a new property descriptor', () => {
            describe('and the descriptor is valid', () => {
                beforeEach(() => {
                    advice = jasmine
                        .createSpy('compileAdvice')
                        .and.callFake(function (ctxt: AdviceContext<any, AdviceType.CLASS>) {
                            const descriptor = {
                                ...Reflect.getOwnPropertyDescriptor(ctxt.target.proto, ctxt.target.propertyKey),
                            };
                            descriptor.value = function () {
                                this.labels = ['methodAdvice'];
                            };
                            return descriptor;
                        });
                });
                it('should use the new method descriptor', () => {
                    class A implements _Labeled {
                        labels: string[] = [];

                        @_AMethod()
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
                    advice = jasmine.createSpy('compileAdvice').and.callFake(() => ({
                        value: () => {},
                        get: () => {},
                    }));
                });

                it('should throw an error', () => {
                    expect(() => {
                        class A {
                            @_AMethod()
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
                    advice = jasmine.createSpy('compileAdvice').and.callFake(() => ({}));
                });

                it('should throw an error', () => {
                    expect(() => {
                        class A {
                            @_AMethod()
                            addLabel() {}
                        }
                    }).toThrow(
                        new WeavingError(
                            'Error applying advice @Compile(@AMethod) CompileAspectA.compileMethod() on method "A.addLabel": Expected advice to return a method descriptor. Got: undefined',
                        ),
                    );
                });
            });
        });
        describe('when multiple @Compile are applied', () => {
            it('should call the two advices', () => {
                class AB {
                    @_BMethod()
                    @_AMethod()
                    private someMethod(ctxt: CompileContext): any {
                        return ctxt.target.descriptor;
                    }
                }

                new AB();
                expect(advice).toHaveBeenCalled();
                expect(compileAdviceB).toHaveBeenCalled();
            });
        });
    });
    describe('applied on a method parameter', () => {
        let annotation: AnnotationContext<any, any>;
        let target: AdviceTarget<unknown, AdviceType.PARAMETER>;

        beforeEach(() => {
            @Aspect()
            class CompileAspect {
                @Compile(on.parameter.withAnnotations(_AParameter))
                compileParameter(ctxt: CompileContext<_Labeled, AdviceType.PARAMETER>) {
                    return advice(ctxt);
                }
            }

            advice = jasmine
                .createSpy('compileAdvice')
                .and.callFake(function (ctxt: CompileContext<_Labeled, AdviceType.PARAMETER>) {
                    target = ctxt.target;
                    instance = (ctxt as any).instance;
                    annotation = ctxt.annotations.all(_AParameter)[0];
                });

            weaver.enable(new CompileAspect());
        });

        it('should call the aspect upon compilation of annotated parameter', () => {
            class A {
                addLabel(@_AParameter() labels: string[]): void {}
            }

            expect(advice).toHaveBeenCalled();
        });

        it('should pass annotation target', () => {
            class A {
                addLabel(@_AParameter('parameterLabel') labels: string[]): void {}
            }

            expect(target).toBeDefined();
            expect(target.proto.constructor.name).toEqual(A.name);
            expect(target.parameterIndex).toEqual(0);
            expect(annotation.args).toEqual(['parameterLabel']);
        });

        it('should not pass context instance', () => {
            class A {
                addLabel(@_AParameter('parameterLabel') labels: string[]): void {}
            }
            expect(target).toBeDefined();
            expect(instance).toBeUndefined();
        });
    });
});
