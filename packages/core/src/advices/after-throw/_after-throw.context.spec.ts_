import { After, AfterThrow, Aspect, Order } from '@aspectjs/core/annotations';
import { Weaver } from '@aspectjs/weaver';
import { setupAspectTestingContext } from '@aspectjs/core/testing';
import { _AClass, _AMethod, _AParameter, _AProperty, _BClass, _BMethod, _BParameter, _BProperty } from '@root/testing';
import { AfterThrowContext, AdviceType, AfterContext, AdviceContext, on } from '@aspectjs/core';

describe('AfterThrowContext', () => {
    let weaver: Weaver;
    let afterThrowAAdvice = jasmine.createSpy('afterThrowAAdvice');
    let afterThrowBAdvice = jasmine.createSpy('afterThrowBAdvice');
    let afterAAdvice = jasmine.createSpy('afterAAdvice');
    let afterBAdvice = jasmine.createSpy('afterBAdvice');

    beforeEach(() => {
        weaver = setupAspectTestingContext().weaverContext.getWeaver();
        afterThrowAAdvice = jasmine.createSpy('afterThrowAAdvice');
        afterThrowBAdvice = jasmine.createSpy('afterThrowBAdvice');
        afterAAdvice = jasmine.createSpy('afterAAdvice');
        afterBAdvice = jasmine.createSpy('afterBAdvice');
    });

    describe('on a class', () => {
        let classAspectA: any;
        let classAspectB: any;
        beforeEach(() => {
            @Aspect()
            class ClassAspectA {
                @Order(1)
                @AfterThrow(on.class.withAnnotations(_AClass))
                afterThrowA(ctxt: AfterThrowContext<any, AdviceType.PROPERTY>): void {
                    afterThrowAAdvice(ctxt);
                }

                @Order(1)
                @After(on.class.withAnnotations(_AClass))
                afterA(ctxt: AfterContext<any, AdviceType.PROPERTY>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class ClassAspectB {
                @Order(0)
                @AfterThrow(on.class.withAnnotations(_BClass))
                afterThrowB(ctxt: AfterThrowContext<any, AdviceType.PROPERTY>): void {
                    afterThrowBAdvice(ctxt);
                }

                @Order(0)
                @After(on.class.withAnnotations(_BClass))
                afterB(ctxt: AfterContext<any, AdviceType.PROPERTY>): void {
                    afterBAdvice(ctxt);
                }
            }
            classAspectA = ClassAspectA;
            classAspectB = ClassAspectB;
            weaver.enable(new ClassAspectA(), new ClassAspectB());
        });
        describe('attribute "ctxt.data"', () => {
            let data: any;

            function pushData(ctxt: AdviceContext<any, any>, message: string): void {
                data = ctxt.data;
                ctxt.data.advices = ctxt.data.advices ?? [];
                ctxt.data.advices.push(message);
            }

            beforeEach(() => {
                data = null;

                afterThrowAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterThrowA'));
                afterThrowBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterThrowB'));
            });
            it('should be shared across two @AfterThrow advices on the same class', () => {
                @_AClass()
                @_BClass()
                class Test {
                    constructor() {
                        throw new Error();
                    }
                }
                new Test();
                expect(afterThrowAAdvice).toHaveBeenCalled();
                expect(afterThrowBAdvice).toHaveBeenCalled();
                expect(data.advices).toEqual(['afterThrowA', 'afterThrowB']);
            });

            it('should not be shared across two @AfterThrow advices on different classes', () => {
                @_AClass()
                class Test1 {
                    constructor() {
                        throw new Error();
                    }
                }
                new Test1();
                expect(data.advices).toEqual(['afterThrowA']);
                @_BClass()
                class Test2 {
                    constructor() {
                        throw new Error();
                    }
                }
                new Test2();

                expect(data.advices).toEqual(['afterThrowB']);
            });

            it('should be shared between a @AfterThrow and a @After advice on the same class', () => {
                afterAAdvice.and.callFake((ctxt: AfterContext<any, any>) => pushData(ctxt, 'afterA'));
                afterBAdvice.and.callFake((ctxt: AfterContext<any, any>) => pushData(ctxt, 'afterB'));

                @_AClass()
                @_BClass()
                class Test {
                    constructor() {
                        throw new Error();
                    }
                }
                new Test();
                expect(data.advices).toEqual(['afterThrowA', 'afterThrowB', 'afterA', 'afterB']);
            });
        });

        it('should be the current AfterThrow advice', () => {
            afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(classAspectA);
            });
            afterThrowBAdvice.and.callFake((ctxt: AfterThrowContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(classAspectB);
            });

            @_AClass()
            @_BClass()
            class Test {
                constructor() {
                    throw new Error();
                }
            }
            [afterThrowAAdvice, afterThrowBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
            new Test();
            [afterThrowAAdvice, afterThrowBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
        });
    });

    describe('on a property', () => {
        let propertyAspectA: any;
        let propertyAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @Order(1)
                @AfterThrow(on.property.withAnnotations(_AProperty))
                aroundA(ctxt: AfterThrowContext<any, AdviceType.CLASS>): void {
                    afterThrowAAdvice(ctxt);
                }

                @Order(1)
                @After(on.property.withAnnotations(_AProperty))
                afterReturnA(ctxt: AfterContext<any, AdviceType.CLASS>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Order(0)
                @AfterThrow(on.property.withAnnotations(_BProperty))
                aroundB(ctxt: AfterThrowContext<any, AdviceType.CLASS>): void {
                    afterThrowBAdvice(ctxt);
                }

                @Order(0)
                @After(on.property.withAnnotations(_BProperty))
                afterReturnB(ctxt: AfterContext<any, AdviceType.CLASS>): void {
                    afterBAdvice(ctxt);
                }
            }
            propertyAspectA = PropertyAspectA;
            propertyAspectB = PropertyAspectB;
            weaver.enable(new PropertyAspectA(), new PropertyAspectB());
        });
        describe('attribute "ctxt.data"', () => {
            let data: any;

            function pushData(ctxt: AdviceContext<any, any>, message: string): void {
                data = ctxt.data;
                ctxt.data.advices = ctxt.data.advices ?? [];
                ctxt.data.advices.push(message);
            }

            beforeEach(() => {
                data = null;

                afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                    pushData(ctxt, 'afterThrowA');
                });
                afterThrowBAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                    pushData(ctxt, 'afterThrowB');
                });
            });
            it('should be shared across two @AfterThrow advices on the same property', () => {
                class Test {
                    @_AProperty()
                    @_BProperty()
                    get prop() {
                        throw new Error();
                    }
                }

                [afterThrowAAdvice, afterThrowBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
                new Test().prop;
                [afterThrowAAdvice, afterThrowBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
                expect(data.advices).toEqual(['afterThrowA', 'afterThrowB']);
            });

            it('should not be shared across two @AfterThrow advices on different properties', () => {
                @_AClass()
                class Test {
                    @_AProperty()
                    get prop1() {
                        throw new Error();
                    }
                    @_BProperty()
                    get prop2() {
                        throw new Error();
                    }
                }
                const t = new Test();

                [afterThrowAAdvice, afterThrowBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
                t.prop1;
                t.prop2;
                [afterThrowAAdvice, afterThrowBAdvice].forEach((f) => expect(f).toHaveBeenCalled());

                expect(data.advices).toEqual(['afterThrowB']);
            });

            it('should be shared between a @AfterThrow and a @After advice on the same property', () => {
                afterAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterA'));
                afterBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterB'));

                class Test {
                    @_AProperty()
                    @_BProperty()
                    get prop() {
                        throw new Error();
                    }
                }

                [afterThrowAAdvice, afterThrowBAdvice, afterAAdvice, afterBAdvice].forEach((f) =>
                    expect(f).not.toHaveBeenCalled(),
                );
                new Test().prop;
                [afterThrowAAdvice, afterThrowBAdvice, afterAAdvice, afterBAdvice].forEach((f) =>
                    expect(f).toHaveBeenCalled(),
                );
                expect(data.advices).toEqual(['afterThrowA', 'afterThrowB', 'afterA', 'afterB']);
            });
        });
        it('should be the current AfterThrow advice', () => {
            afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(propertyAspectA);
            });
            afterThrowBAdvice.and.callFake((ctxt: AfterThrowContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(propertyAspectB);
            });

            class Test {
                @_AProperty()
                @_BProperty()
                get prop() {
                    throw new Error();
                }
            }

            [afterThrowAAdvice, afterThrowBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
            new Test().prop;
            [afterThrowAAdvice, afterThrowBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
        });
    });

    describe('on a property setter', () => {
        let propertyAspectA: any;
        let propertyAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @Order(1)
                @AfterThrow(on.property.setter.withAnnotations(_AProperty))
                aroundA(ctxt: AfterThrowContext<any, AdviceType.CLASS>): void {
                    afterThrowAAdvice(ctxt);
                }

                @Order(1)
                @After(on.property.setter.withAnnotations(_AProperty))
                afterReturnA(ctxt: AfterContext<any, AdviceType.CLASS>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Order(0)
                @AfterThrow(on.property.setter.withAnnotations(_BProperty))
                aroundB(ctxt: AfterThrowContext<any, AdviceType.CLASS>): void {
                    afterThrowBAdvice(ctxt);
                }

                @Order(0)
                @After(on.property.setter.withAnnotations(_BProperty))
                afterReturnB(ctxt: AfterContext<any, AdviceType.CLASS>): void {
                    afterBAdvice(ctxt);
                }
            }
            propertyAspectA = PropertyAspectA;
            propertyAspectB = PropertyAspectB;
            weaver.enable(new PropertyAspectA(), new PropertyAspectB());
        });
        describe('attribute "ctxt.data"', () => {
            let data: any;

            function pushData(ctxt: AdviceContext<any, any>, message: string): void {
                data = ctxt.data;
                ctxt.data.advices = ctxt.data.advices ?? [];
                ctxt.data.advices.push(message);
            }

            beforeEach(() => {
                data = null;

                afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                    pushData(ctxt, 'afterThrowA');
                });
                afterThrowBAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                    pushData(ctxt, 'afterThrowB');
                });
            });
            it('should be shared across two @AfterThrow advices on the same property', () => {
                class Test {
                    @_AProperty()
                    @_BProperty()
                    set prop(x: any) {
                        throw new Error();
                    }
                }
                [afterThrowAAdvice, afterThrowBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                new Test().prop = 'toto';
                [afterThrowAAdvice, afterThrowBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());
                expect(data.advices).toEqual(['afterThrowA', 'afterThrowB']);
            });

            it('should not be shared across two @AfterThrow advices on different properties', () => {
                @_AClass()
                class Test {
                    @_AProperty()
                    set prop1(x: any) {
                        throw new Error();
                    }

                    @_BProperty()
                    set prop2(x: any) {
                        throw new Error();
                    }
                }

                [afterThrowAAdvice, afterThrowBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                const t = new Test();
                t.prop1 = 'toto';
                t.prop2 = 'toto';
                [afterThrowAAdvice, afterThrowBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());

                expect(data.advices).toEqual(['afterThrowB']);
            });

            it('should be shared between a @AfterThrow and a @After advice on the same property', () => {
                afterAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterA'));
                afterBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterB'));

                class Test {
                    @_AProperty()
                    @_BProperty()
                    set prop(x: any) {
                        throw new Error();
                    }
                }
                [afterThrowAAdvice, afterThrowBAdvice, afterAAdvice, afterBAdvice].forEach((fn) =>
                    expect(fn).not.toHaveBeenCalled(),
                );
                new Test().prop = '';
                [afterThrowAAdvice, afterThrowBAdvice, afterAAdvice, afterBAdvice].forEach((fn) =>
                    expect(fn).toHaveBeenCalled(),
                );
                expect(data.advices).toEqual(['afterThrowA', 'afterThrowB', 'afterA', 'afterB']);
            });
        });

        it('should be the current AfterThrow advice', () => {
            afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(propertyAspectA);
            });
            afterThrowBAdvice.and.callFake((ctxt: AfterThrowContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(propertyAspectB);
            });

            class Test {
                @_AProperty()
                @_BProperty()
                set prop(x: any) {
                    throw new Error();
                }
            }

            [afterThrowAAdvice, afterThrowBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
            new Test().prop = '';
            [afterThrowAAdvice, afterThrowBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
        });

        it('should be the current AfterThrow advice', () => {
            afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(propertyAspectA);
            });
            afterThrowBAdvice.and.callFake((ctxt: AfterThrowContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(propertyAspectB);
            });

            class Test {
                @_AProperty()
                @_BProperty()
                set prop(x: any) {
                    throw new Error();
                }
            }

            [afterThrowAAdvice, afterThrowBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
            new Test().prop = '';
            [afterThrowAAdvice, afterThrowBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
        });
    });

    describe('on a method', () => {
        let methodAspectA: any;
        let methodAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @Order(1)
                @AfterThrow(on.method.withAnnotations(_AMethod))
                aroundA(ctxt: AfterThrowContext<any, AdviceType.METHOD>): void {
                    afterThrowAAdvice(ctxt);
                }

                @Order(1)
                @After(on.method.withAnnotations(_AMethod))
                afterReturnA(ctxt: AfterContext<any, AdviceType.METHOD>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Order(0)
                @AfterThrow(on.method.withAnnotations(_BMethod))
                aroundB(ctxt: AfterThrowContext<any, AdviceType.METHOD>): void {
                    afterThrowBAdvice(ctxt);
                }

                @Order(0)
                @After(on.method.withAnnotations(_BMethod))
                afterReturnB(ctxt: AfterContext<any, AdviceType.METHOD>): void {
                    afterBAdvice(ctxt);
                }
            }
            methodAspectA = PropertyAspectA;
            methodAspectB = PropertyAspectB;
            weaver.enable(new PropertyAspectA(), new PropertyAspectB());
        });
        describe('attribute "ctxt.data"', () => {
            let data: any;

            function pushData(ctxt: AdviceContext<any, any>, message: string): void {
                data = ctxt.data;
                ctxt.data.advices = ctxt.data.advices ?? [];
                ctxt.data.advices.push(message);
            }

            beforeEach(() => {
                data = null;

                afterThrowAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterThrowA'));
                afterThrowBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterThrowB'));
            });

            it('should be shared across two @AfterThrow advices on the same method', () => {
                class Test {
                    @_AMethod()
                    @_BMethod()
                    someMethod(): any {
                        throw new Error();
                    }
                }
                [afterThrowAAdvice, afterThrowBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                new Test().someMethod();
                [afterThrowAAdvice, afterThrowBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());

                expect(data.advices).toEqual(['afterThrowA', 'afterThrowB']);
            });

            it('should not be shared across two @AfterThrow advices on different method', () => {
                @_AClass()
                class Test {
                    @_AMethod()
                    method1(): any {
                        throw new Error();
                    }

                    @_BMethod()
                    method2(): any {
                        throw new Error();
                    }
                }

                [afterThrowAAdvice, afterThrowBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                const t = new Test();
                t.method1();
                t.method2();
                [afterThrowAAdvice, afterThrowBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());

                expect(data.advices).toEqual(['afterThrowB']);
            });

            it('should be shared between a @AfterThrow and a @After advice on the same method', () => {
                afterAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterA'));
                afterBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterB'));

                class Test {
                    @_AMethod()
                    @_BMethod()
                    method(): any {
                        throw new Error();
                    }
                }

                new Test().method();
                expect(data.advices).toEqual(['afterThrowA', 'afterThrowB', 'afterA', 'afterB']);
            });
        });

        it('should be the current AfterThrow advice', () => {
            afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(methodAspectA);
            });
            afterThrowBAdvice.and.callFake((ctxt: AfterThrowContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(methodAspectB);
            });

            class Test {
                @_AMethod()
                @_BMethod()
                method(): any {
                    throw new Error();
                }
            }

            [afterThrowAAdvice, afterThrowBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
            new Test().method();
            [afterThrowAAdvice, afterThrowBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
        });
    });

    describe('on a parameter', () => {
        let parameterAspectA: any;
        let parameterAspectB: any;
        beforeEach(() => {
            @Aspect()
            class ParameterAspectA {
                @Order(1)
                @AfterThrow(on.parameter.withAnnotations(_AParameter))
                aroundA(ctxt: AfterThrowContext<any, AdviceType.PARAMETER>): void {
                    afterThrowAAdvice(ctxt);
                }

                @Order(1)
                @After(on.parameter.withAnnotations(_AParameter))
                afterReturnA(ctxt: AfterContext<any, AdviceType.PARAMETER>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class ParameterAspectB {
                @Order(0)
                @AfterThrow(on.parameter.withAnnotations(_BParameter))
                aroundB(ctxt: AfterThrowContext<any, AdviceType.PARAMETER>): void {
                    afterThrowBAdvice(ctxt);
                }

                @Order(0)
                @After(on.parameter.withAnnotations(_BParameter))
                afterReturnB(ctxt: AfterContext<any, AdviceType.PARAMETER>): void {
                    afterBAdvice(ctxt);
                }
            }
            parameterAspectA = ParameterAspectA;
            parameterAspectB = ParameterAspectB;
            weaver.enable(new ParameterAspectA(), new ParameterAspectB());
        });
        describe('attribute "ctxt.data"', () => {
            let data: any;

            function pushData(ctxt: AdviceContext<any, any>, message: string) {
                data = ctxt.data;
                ctxt.data.advices = ctxt.data.advices ?? [];
                ctxt.data.advices.push(message);
            }

            beforeEach(() => {
                data = null;

                afterThrowAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterThrowA'));
                afterThrowBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterThrowB'));
            });
            it('should be shared across two @AfterThrow advices on the same parameter', () => {
                class Test {
                    someMethod(@_AParameter() @_BParameter() param: any): any {
                        throw new Error();
                    }
                }

                new Test().someMethod('');

                expect(data.advices).toEqual(['afterThrowA', 'afterThrowB']);
            });

            it('should not be shared across two @AfterThrow advices on different parameters', () => {
                class Test {
                    someMethod(@_AParameter() paramA: any, @_BParameter() paramB: any): any {
                        throw new Error();
                    }
                }
                new Test().someMethod('', '');

                expect(data.advices).toEqual(['afterThrowA']);
            });

            it('should be shared between a @AfterThrow and a @After advice on the same parameters', () => {
                afterAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterA'));
                afterBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterB'));

                class Test {
                    someMethod(@_AParameter() @_BParameter() param: any): any {
                        throw new Error();
                    }
                }

                new Test().someMethod('');
                expect(data.advices).toEqual(['afterThrowA', 'afterThrowB', 'afterA', 'afterB']);
            });
        });
        it('should be the current AfterThrow advice', () => {
            afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(parameterAspectA);
            });
            afterThrowBAdvice.and.callFake((ctxt: AfterThrowContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(parameterAspectB);
            });

            class Test {
                someMethod(@_AParameter() @_BParameter() param: any): any {
                    throw new Error();
                }
            }

            [afterThrowAAdvice, afterThrowBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
            new Test().someMethod('');
            [afterThrowAAdvice, afterThrowBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
        });
    });
});
