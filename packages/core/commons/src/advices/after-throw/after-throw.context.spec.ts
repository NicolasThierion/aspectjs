import { After, AfterThrow, Aspect, Order } from '@aspectjs/core/annotations';
import {
    AClass,
    AMethod,
    AParameter,
    AProperty,
    BClass,
    BMethod,
    BParameter,
    BProperty,
    setupTestingWeaverContext,
} from '@aspectjs/core/testing';

import { on } from '../../types';
import { Weaver } from '../../weaver';
import { AdviceContext, AdviceType, AfterContext, AfterThrowContext, AroundContext } from '../types';

describe('AfterThrowContext', () => {
    let weaver: Weaver;
    let afterThrowAAdvice = jasmine.createSpy('afterThrowAAdvice');
    let afterThrowBAdvice = jasmine.createSpy('afterThrowBAdvice');
    let afterAAdvice = jasmine.createSpy('afterAAdvice');
    let afterBAdvice = jasmine.createSpy('afterBAdvice');

    beforeEach(() => {
        weaver = setupTestingWeaverContext().getWeaver();
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
                @AfterThrow(on.class.withAnnotations(AClass))
                afterThrowA(ctxt: AfterThrowContext<any, AdviceType.PROPERTY>): void {
                    afterThrowAAdvice(ctxt);
                }

                @Order(1)
                @After(on.class.withAnnotations(AClass))
                afterA(ctxt: AfterContext<any, AdviceType.PROPERTY>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class ClassAspectB {
                @Order(0)
                @AfterThrow(on.class.withAnnotations(BClass))
                afterThrowB(ctxt: AfterThrowContext<any, AdviceType.PROPERTY>): void {
                    afterThrowBAdvice(ctxt);
                }

                @Order(0)
                @After(on.class.withAnnotations(BClass))
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
                @AClass()
                @BClass()
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
                @AClass()
                class Test1 {
                    constructor() {
                        throw new Error();
                    }
                }
                new Test1();
                expect(data.advices).toEqual(['afterThrowA']);
                @BClass()
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

                @AClass()
                @BClass()
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

            @AClass()
            @BClass()
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
                @AfterThrow(on.property.withAnnotations(AProperty))
                aroundA(ctxt: AfterThrowContext<any, AdviceType.CLASS>): void {
                    afterThrowAAdvice(ctxt);
                }

                @Order(1)
                @After(on.property.withAnnotations(AProperty))
                afterReturnA(ctxt: AfterContext<any, AdviceType.CLASS>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Order(0)
                @AfterThrow(on.property.withAnnotations(BProperty))
                aroundB(ctxt: AfterThrowContext<any, AdviceType.CLASS>): void {
                    afterThrowBAdvice(ctxt);
                }

                @Order(0)
                @After(on.property.withAnnotations(BProperty))
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
                    @AProperty()
                    @BProperty()
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
                @AClass()
                class Test {
                    @AProperty()
                    get prop1() {
                        throw new Error();
                    }
                    @BProperty()
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
                    @AProperty()
                    @BProperty()
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
                @AProperty()
                @BProperty()
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
                @AfterThrow(on.property.setter.withAnnotations(AProperty))
                aroundA(ctxt: AfterThrowContext<any, AdviceType.CLASS>): void {
                    afterThrowAAdvice(ctxt);
                }

                @Order(1)
                @After(on.property.setter.withAnnotations(AProperty))
                afterReturnA(ctxt: AfterContext<any, AdviceType.CLASS>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Order(0)
                @AfterThrow(on.property.setter.withAnnotations(BProperty))
                aroundB(ctxt: AfterThrowContext<any, AdviceType.CLASS>): void {
                    afterThrowBAdvice(ctxt);
                }

                @Order(0)
                @After(on.property.setter.withAnnotations(BProperty))
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
                    @AProperty()
                    @BProperty()
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
                @AClass()
                class Test {
                    @AProperty()
                    set prop1(x: any) {
                        throw new Error();
                    }

                    @BProperty()
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
                    @AProperty()
                    @BProperty()
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
                @AProperty()
                @BProperty()
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
                @AProperty()
                @BProperty()
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
                @AfterThrow(on.method.withAnnotations(AMethod))
                aroundA(ctxt: AfterThrowContext<any, AdviceType.METHOD>): void {
                    afterThrowAAdvice(ctxt);
                }

                @Order(1)
                @After(on.method.withAnnotations(AMethod))
                afterReturnA(ctxt: AfterContext<any, AdviceType.METHOD>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Order(0)
                @AfterThrow(on.method.withAnnotations(BMethod))
                aroundB(ctxt: AfterThrowContext<any, AdviceType.METHOD>): void {
                    afterThrowBAdvice(ctxt);
                }

                @Order(0)
                @After(on.method.withAnnotations(BMethod))
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
                    @AMethod()
                    @BMethod()
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
                @AClass()
                class Test {
                    @AMethod()
                    method1(): any {
                        throw new Error();
                    }

                    @BMethod()
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
                    @AMethod()
                    @BMethod()
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
                @AMethod()
                @BMethod()
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
                @AfterThrow(on.parameter.withAnnotations(AParameter))
                aroundA(ctxt: AfterThrowContext<any, AdviceType.PARAMETER>): void {
                    afterThrowAAdvice(ctxt);
                }

                @Order(1)
                @After(on.parameter.withAnnotations(AParameter))
                afterReturnA(ctxt: AfterContext<any, AdviceType.PARAMETER>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class ParameterAspectB {
                @Order(0)
                @AfterThrow(on.parameter.withAnnotations(BParameter))
                aroundB(ctxt: AfterThrowContext<any, AdviceType.PARAMETER>): void {
                    afterThrowBAdvice(ctxt);
                }

                @Order(0)
                @After(on.parameter.withAnnotations(BParameter))
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
                    someMethod(@AParameter() @BParameter() param: any): any {
                        throw new Error();
                    }
                }

                new Test().someMethod('');

                expect(data.advices).toEqual(['afterThrowA', 'afterThrowB']);
            });

            it('should not be shared across two @AfterThrow advices on different parameters', () => {
                class Test {
                    someMethod(@AParameter() paramA: any, @BParameter() paramB: any): any {
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
                    someMethod(@AParameter() @BParameter() param: any): any {
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
                someMethod(@AParameter() @BParameter() param: any): any {
                    throw new Error();
                }
            }

            [afterThrowAAdvice, afterThrowBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
            new Test().someMethod('');
            [afterThrowAAdvice, afterThrowBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
        });
    });
});
