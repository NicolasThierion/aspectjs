import { After, AfterReturn, Aspect, Order } from '@aspectjs/core/annotations';
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
import { AdviceContext, AdviceType, AfterContext, AfterReturnContext, AfterThrowContext } from '../types';

describe('AfterReturnContext', () => {
    let weaver: Weaver;
    let afterReturnAAdvice = jasmine.createSpy('afterReturnAAdvice');
    let afterReturnBAdvice = jasmine.createSpy('afterReturnBAdvice');
    let afterAAdvice = jasmine.createSpy('afterAAdvice');
    let afterBAdvice = jasmine.createSpy('afterBAdvice');

    beforeEach(() => {
        weaver = setupTestingWeaverContext().getWeaver();
        afterReturnAAdvice = jasmine.createSpy('afterReturnAAdvice');
        afterReturnBAdvice = jasmine.createSpy('afterReturnBAdvice');
        afterAAdvice = jasmine.createSpy('afterAAdvice');
        afterBAdvice = jasmine.createSpy('afterBAdvice');
    });

    describe('on a class', () => {
        let classAspectA: any;
        let classAspectB: any;
        beforeEach(() => {
            @Aspect()
            class ClassAspectA {
                @AfterReturn(on.class.withAnnotations(AClass))
                @Order(1)
                afterReturnA(ctxt: AfterReturnContext<any, AdviceType.PROPERTY>): void {
                    afterReturnAAdvice(ctxt);
                }

                @After(on.class.withAnnotations(AClass))
                @Order(1)
                afterA(ctxt: AfterContext<any, AdviceType.PROPERTY>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class ClassAspectB {
                @AfterReturn(on.class.withAnnotations(BClass))
                @Order(0)
                afterReturnB(ctxt: AfterReturnContext<any, AdviceType.PROPERTY>): void {
                    afterReturnBAdvice(ctxt);
                }

                @After(on.class.withAnnotations(BClass))
                @Order(0)
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

                afterReturnAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterReturnA'));
                afterReturnBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterReturnB'));
            });
            it('should be shared across two @AfterReturn advices on the same class', () => {
                @AClass()
                @BClass()
                class Test {}
                new Test();
                expect(afterReturnAAdvice).toHaveBeenCalled();
                expect(afterReturnBAdvice).toHaveBeenCalled();
                expect(data.advices).toEqual(['afterReturnA', 'afterReturnB']);
            });

            it('should not be shared across two @AfterReturn advices on different classes', () => {
                @AClass()
                class Test1 {}
                new Test1();
                expect(data.advices).toEqual(['afterReturnA']);
                @BClass()
                class Test2 {}
                new Test2();

                expect(data.advices).toEqual(['afterReturnB']);
            });

            it('should be shared between a @AfterReturn and a @After advice on the same class', () => {
                afterAAdvice.and.callFake((ctxt: AfterContext<any, any>) => pushData(ctxt, 'afterA'));
                afterBAdvice.and.callFake((ctxt: AfterContext<any, any>) => pushData(ctxt, 'afterB'));

                @AClass()
                @BClass()
                class Test {}
                new Test();
                expect(data.advices).toEqual(['afterReturnA', 'afterReturnB', 'afterA', 'afterB']);
            });
        });
        it('should be the current After advice', () => {
            afterAAdvice.and.callFake((ctxt: AfterThrowContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(classAspectA);
            });
            afterBAdvice.and.callFake((ctxt: AfterThrowContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(classAspectB);
            });

            @AClass()
            @BClass()
            class Test {}

            [afterAAdvice, afterBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
            new Test();
            [afterAAdvice, afterBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
        });
    });

    describe('on a property', () => {
        let propertyAspectA: any;
        let propertyAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @Order(1)
                @AfterReturn(on.property.withAnnotations(AProperty))
                afterReturnA(ctxt: AfterReturnContext<any, AdviceType.CLASS>): void {
                    afterReturnAAdvice(ctxt);
                }

                @Order(1)
                @After(on.property.withAnnotations(AProperty))
                afterA(ctxt: AfterContext<any, AdviceType.CLASS>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Order(0)
                @AfterReturn(on.property.withAnnotations(BProperty))
                afterReturnB(ctxt: AfterReturnContext<any, AdviceType.CLASS>): void {
                    afterReturnBAdvice(ctxt);
                }

                @Order(0)
                @After(on.property.withAnnotations(BProperty))
                afterB(ctxt: AfterContext<any, AdviceType.CLASS>): void {
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

                afterReturnAAdvice.and.callFake((ctxt: AfterReturnContext<any, any>) => {
                    pushData(ctxt, 'afterReturnA');
                });
                afterReturnBAdvice.and.callFake((ctxt: AfterReturnContext<any, any>) => {
                    pushData(ctxt, 'afterReturnB');
                });
            });
            it('should be shared across two @AfterReturn advices on the same property', () => {
                class Test {
                    @AProperty()
                    @BProperty()
                    prop: any;
                }

                [afterReturnAAdvice, afterReturnBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
                new Test().prop;
                [afterReturnAAdvice, afterReturnBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
                expect(data.advices).toEqual(['afterReturnA', 'afterReturnB']);
            });

            it('should not be shared across two @AfterReturn advices on different properties', () => {
                @AClass()
                class Test {
                    @AProperty()
                    prop1: any;
                    @BProperty()
                    prop2: any;
                }
                const t = new Test();

                [afterReturnAAdvice, afterReturnBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
                t.prop1;
                t.prop2;
                [afterReturnAAdvice, afterReturnBAdvice].forEach((f) => expect(f).toHaveBeenCalled());

                expect(data.advices).toEqual(['afterReturnB']);
            });

            it('should be shared between a @AfterReturn and a @After advice on the same property', () => {
                afterAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterA'));
                afterBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterB'));

                class Test {
                    @AProperty()
                    @BProperty()
                    prop: any;
                }

                [afterReturnAAdvice, afterReturnBAdvice, afterAAdvice, afterBAdvice].forEach((f) =>
                    expect(f).not.toHaveBeenCalled(),
                );
                new Test().prop;
                [afterReturnAAdvice, afterReturnBAdvice, afterAAdvice, afterBAdvice].forEach((f) =>
                    expect(f).toHaveBeenCalled(),
                );
                expect(data.advices).toEqual(['afterReturnA', 'afterReturnB', 'afterA', 'afterB']);
            });
        });

        it('should be the current After advice', () => {
            afterAAdvice.and.callFake((ctxt: AfterThrowContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(propertyAspectA);
            });
            afterBAdvice.and.callFake((ctxt: AfterThrowContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(propertyAspectB);
            });

            class Test {
                @AProperty()
                @BProperty()
                prop: any;
            }

            [afterAAdvice, afterBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
            new Test().prop;
            [afterAAdvice, afterBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
        });
    });

    describe('on a property setter', () => {
        let propertyAspectA: any;
        let propertyAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @Order(1)
                @AfterReturn(on.property.setter.withAnnotations(AProperty))
                afterReturnA(ctxt: AfterReturnContext<any, AdviceType.CLASS>): void {
                    afterReturnAAdvice(ctxt);
                }
                @Order(1)
                @After(on.property.setter.withAnnotations(AProperty))
                afterA(ctxt: AfterContext<any, AdviceType.CLASS>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Order(0)
                @AfterReturn(on.property.setter.withAnnotations(BProperty))
                afterReturnB(ctxt: AfterReturnContext<any, AdviceType.CLASS>): void {
                    afterReturnBAdvice(ctxt);
                }

                @Order(0)
                @After(on.property.setter.withAnnotations(BProperty))
                afterB(ctxt: AfterContext<any, AdviceType.CLASS>): void {
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

                afterReturnAAdvice.and.callFake((ctxt: AfterReturnContext<any, any>) => {
                    pushData(ctxt, 'afterReturnA');
                });
                afterReturnBAdvice.and.callFake((ctxt: AfterReturnContext<any, any>) => {
                    pushData(ctxt, 'afterReturnB');
                });
            });
            it('should be shared across two @AfterReturn advices on the same property', () => {
                class Test {
                    @AProperty()
                    @BProperty()
                    prop: any;
                }
                [afterReturnAAdvice, afterReturnBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                new Test().prop = 'toto';
                [afterReturnAAdvice, afterReturnBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());
                expect(data.advices).toEqual(['afterReturnA', 'afterReturnB']);
            });

            it('should not be shared across two @AfterReturn advices on different properties', () => {
                @AClass()
                class Test {
                    @AProperty()
                    prop1: any;

                    @BProperty()
                    prop2: any;
                }

                [afterReturnAAdvice, afterReturnBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                const t = new Test();
                t.prop1 = 'toto';
                t.prop2 = 'toto';
                [afterReturnAAdvice, afterReturnBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());

                expect(data.advices).toEqual(['afterReturnB']);
            });

            it('should be shared between a @AfterReturn and a @After advice on the same property', () => {
                afterAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterA'));
                afterBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterB'));

                class Test {
                    @AProperty()
                    @BProperty()
                    prop: any;
                }
                [afterReturnAAdvice, afterReturnBAdvice, afterAAdvice, afterBAdvice].forEach((fn) =>
                    expect(fn).not.toHaveBeenCalled(),
                );
                new Test().prop = '';
                [afterReturnAAdvice, afterReturnBAdvice, afterAAdvice, afterBAdvice].forEach((fn) =>
                    expect(fn).toHaveBeenCalled(),
                );
                expect(data.advices).toEqual(['afterReturnA', 'afterReturnB', 'afterA', 'afterB']);
            });
        });

        it('should be the current After advice', () => {
            afterAAdvice.and.callFake((ctxt: AfterThrowContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(propertyAspectA);
            });
            afterBAdvice.and.callFake((ctxt: AfterThrowContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(propertyAspectB);
            });

            class Test {
                @AProperty()
                @BProperty()
                prop: any;
            }

            [afterAAdvice, afterBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
            new Test().prop = '';
            [afterAAdvice, afterBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
        });
    });

    describe('on a method', () => {
        let methodAspectA: any;
        let methodAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @Order(1)
                @AfterReturn(on.method.withAnnotations(AMethod))
                afterReturnA(ctxt: AfterReturnContext<any, AdviceType.METHOD>): void {
                    afterReturnAAdvice(ctxt);
                }

                @Order(1)
                @After(on.method.withAnnotations(AMethod))
                afterA(ctxt: AfterContext<any, AdviceType.METHOD>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Order(0)
                @AfterReturn(on.method.withAnnotations(BMethod))
                afterReturnB(ctxt: AfterReturnContext<any, AdviceType.METHOD>): void {
                    afterReturnBAdvice(ctxt);
                }

                @Order(0)
                @After(on.method.withAnnotations(BMethod))
                afterB(ctxt: AfterContext<any, AdviceType.METHOD>): void {
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

                afterReturnAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterReturnA'));
                afterReturnBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterReturnB'));
            });

            it('should be shared across two @AfterReturn advices on the same method', () => {
                class Test {
                    @AMethod()
                    @BMethod()
                    someMethod(): any {}
                }
                [afterReturnAAdvice, afterReturnBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                new Test().someMethod();
                [afterReturnAAdvice, afterReturnBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());

                expect(data.advices).toEqual(['afterReturnA', 'afterReturnB']);
            });

            it('should not be shared across two @AfterReturn advices on different method', () => {
                @AClass()
                class Test {
                    @AMethod()
                    method1(): any {}

                    @BMethod()
                    method2(): any {}
                }

                [afterReturnAAdvice, afterReturnBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                const t = new Test();
                t.method1();
                t.method2();
                [afterReturnAAdvice, afterReturnBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());

                expect(data.advices).toEqual(['afterReturnB']);
            });

            it('should be shared between a @AfterReturn and a @After advice on the same method', () => {
                afterAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterA'));
                afterBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterB'));

                class Test {
                    @AMethod()
                    @BMethod()
                    method(): any {}
                }

                new Test().method();
                expect(data.advices).toEqual(['afterReturnA', 'afterReturnB', 'afterA', 'afterB']);
            });
        });
        it('should be the current After advice', () => {
            afterAAdvice.and.callFake((ctxt: AfterThrowContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(methodAspectA);
            });
            afterBAdvice.and.callFake((ctxt: AfterThrowContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(methodAspectB);
            });

            class Test {
                @AMethod()
                @BMethod()
                method(): any {}
            }

            [afterAAdvice, afterBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
            new Test().method();
            [afterAAdvice, afterBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
        });
    });

    describe('on a parameter', () => {
        let parameterAspectA: any;
        let parameterAspectB: any;
        beforeEach(() => {
            @Aspect()
            class ParameterAspectA {
                @Order(1)
                @AfterReturn(on.parameter.withAnnotations(AParameter))
                afterReturnA(ctxt: AfterReturnContext<any, AdviceType.PARAMETER>): void {
                    afterReturnAAdvice(ctxt);
                }

                @Order(1)
                @After(on.parameter.withAnnotations(AParameter))
                afterA(ctxt: AfterContext<any, AdviceType.PARAMETER>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class ParameterAspectB {
                @Order(0)
                @AfterReturn(on.parameter.withAnnotations(BParameter))
                afterReturnB(ctxt: AfterReturnContext<any, AdviceType.PARAMETER>): void {
                    afterReturnBAdvice(ctxt);
                }

                @Order(0)
                @After(on.parameter.withAnnotations(BParameter))
                afterB(ctxt: AfterContext<any, AdviceType.PARAMETER>): void {
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

                afterReturnAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterReturnA'));
                afterReturnBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterReturnB'));
            });
            it('should be shared across two @AfterReturn advices on the same parameter', () => {
                class Test {
                    someMethod(@AParameter() @BParameter() param: any): any {}
                }

                new Test().someMethod('');

                expect(data.advices).toEqual(['afterReturnA', 'afterReturnB']);
            });

            it('should not be shared across two @AfterReturn advices on different parameters', () => {
                class Test {
                    someMethod(@AParameter() paramA: any, @BParameter() paramB: any): any {}
                }
                new Test().someMethod('', '');

                expect(data.advices).toEqual(['afterReturnA']);
            });

            it('should be shared between a @AfterReturn and a @After advice on the same parameters', () => {
                afterAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterA'));
                afterBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterB'));

                class Test {
                    someMethod(@AParameter() @BParameter() param: any): any {}
                }

                new Test().someMethod('');
                expect(data.advices).toEqual(['afterReturnA', 'afterReturnB', 'afterA', 'afterB']);
            });
        });

        it('should be the current After advice', () => {
            afterAAdvice.and.callFake((ctxt: AfterThrowContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(parameterAspectA);
            });
            afterBAdvice.and.callFake((ctxt: AfterThrowContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(parameterAspectB);
            });

            class Test {
                someMethod(@AParameter() @BParameter() param: any): any {}
            }

            [afterAAdvice, afterBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
            new Test().someMethod('');
            [afterAAdvice, afterBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
        });
    });
});
