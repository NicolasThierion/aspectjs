import { Around, Aspect, Before, Order } from '@aspectjs/core/annotations';
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
import { JoinPoint, on } from '../../types';
import { Weaver } from '../../weaver';
import { AdviceContext, AdviceType, AroundContext, BeforeContext } from '../types';

describe('BeforeContext', () => {
    let weaver: Weaver;
    let beforeAAdvice: jasmine.Spy;
    let beforeBAdvice: jasmine.Spy;
    let aroundAAdvice: jasmine.Spy;
    let aroundBAdvice: jasmine.Spy;

    beforeEach(() => {
        weaver = setupTestingWeaverContext().getWeaver();
        beforeAAdvice = jasmine.createSpy('beforeAAdvice');
        beforeBAdvice = jasmine.createSpy('beforeBAdvice');
        aroundAAdvice = jasmine.createSpy('aroundAAdvice').and.callFake((ctxt, jp) => jp());
        aroundBAdvice = jasmine.createSpy('aroundBAdvice').and.callFake((ctxt, jp) => jp());
    });

    describe('on a class', () => {
        let classAspectA: any;
        let classAspectB: any;
        beforeEach(() => {
            @Aspect()
            class ClassAspectA {
                @Order(1)
                @Before(on.class.withAnnotations(AClass))
                beforeA(ctxt: BeforeContext<any, AdviceType.PROPERTY>): void {
                    beforeAAdvice(ctxt);
                }

                @Order(1)
                @Around(on.class.withAnnotations(AClass))
                aroundA(ctxt: AroundContext<any, AdviceType.PROPERTY>, jp: JoinPoint): void {
                    aroundAAdvice(ctxt, jp);
                }
            }
            @Aspect()
            class ClassAspectB {
                @Order(2)
                @Before(on.class.withAnnotations(BClass))
                beforeB(ctxt: BeforeContext<any, AdviceType.PROPERTY>): void {
                    beforeBAdvice(ctxt);
                }

                @Order(2)
                @Around(on.class.withAnnotations(BClass))
                aroundB(ctxt: AroundContext<any, AdviceType.PROPERTY>, jp: JoinPoint): void {
                    aroundBAdvice(ctxt, jp);
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

                beforeAAdvice.and.callFake((ctxt) => pushData(ctxt, 'beforeA'));
                beforeBAdvice.and.callFake((ctxt) => pushData(ctxt, 'beforeB'));
            });
            it('should be shared across two @Before advices on the same class', () => {
                @AClass()
                @BClass()
                class Test {}
                new Test();

                expect(data.advices).toEqual(['beforeA', 'beforeB']);
            });

            it('should not be shared across two @Before advices on different classes', () => {
                @AClass()
                class Test1 {}
                new Test1();
                expect(data.advices).toEqual(['beforeA']);
                @BClass()
                class Test2 {}
                new Test2();

                expect(data.advices).toEqual(['beforeB']);
            });

            it('should be shared between a @Before and a @Around advice on the same class', () => {
                aroundAAdvice.and.callFake((ctxt: AroundContext, jp: JoinPoint) => {
                    pushData(ctxt, 'aroundA');
                    return jp();
                });
                aroundBAdvice.and.callFake((ctxt: AroundContext, jp: JoinPoint) => {
                    pushData(ctxt, 'aroundB');
                    return jp();
                });

                @AClass()
                @BClass()
                class Test {}
                new Test();
                expect(data.advices).toEqual(['aroundA', 'aroundB', 'beforeA', 'beforeB']);
            });
        });
        describe('attribute "ctxt.advice"', () => {
            it('should be the current before advice', () => {
                aroundAAdvice.and.callFake((ctxt: BeforeContext) => {
                    expect(ctxt.advice.aspect.constructor).toEqual(classAspectA);
                });
                aroundBAdvice.and.callFake((ctxt: BeforeContext) => {
                    expect(ctxt.advice.aspect.constructor).toEqual(classAspectB);
                });

                @AClass()
                @BClass()
                class Test {}
                new Test();
            });
        });
    });
    describe('on a property', () => {
        let propertyAspectA: any;
        let propertyAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @Order(1)
                @Before(on.property.withAnnotations(AProperty))
                beforeA(ctxt: BeforeContext<any, AdviceType.CLASS>): void {
                    beforeAAdvice(ctxt);
                }

                @Order(1)
                @Around(on.property.withAnnotations(AProperty))
                aroundA(ctxt: AroundContext, jp: JoinPoint): void {
                    aroundAAdvice(ctxt, jp);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Order(2)
                @Before(on.property.withAnnotations(BProperty))
                beforeB(ctxt: BeforeContext<any, AdviceType.CLASS>): void {
                    beforeBAdvice(ctxt);
                }

                @Order(2)
                @Around(on.property.withAnnotations(BProperty))
                aroundB(ctxt: AroundContext, jp: JoinPoint): void {
                    aroundBAdvice(ctxt, jp);
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

                beforeAAdvice.and.callFake((ctxt) => pushData(ctxt, 'beforeA'));
                beforeBAdvice.and.callFake((ctxt) => pushData(ctxt, 'beforeB'));
            });
            it('should be shared across two @Before advices on the same property', () => {
                class Test {
                    @AProperty()
                    @BProperty()
                    prop: any;
                }

                [beforeAAdvice, beforeBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
                new Test().prop;
                [beforeAAdvice, beforeBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
                expect(data.advices).toEqual(['beforeA', 'beforeB']);
            });

            it('should not be shared across two @Before advices on different properties', () => {
                @AClass()
                class Test {
                    @AProperty()
                    prop1: any;

                    @BProperty()
                    prop2: any;
                }
                const t = new Test();

                [beforeAAdvice, beforeBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
                t.prop1;
                t.prop2;
                [beforeAAdvice, beforeBAdvice].forEach((f) => expect(f).toHaveBeenCalled());

                expect(data.advices).toEqual(['beforeB']);
            });

            it('should be shared between a @Before and a @Around advice on the same property', () => {
                aroundAAdvice.and.callFake((ctxt, jp: JoinPoint) => {
                    pushData(ctxt, 'aroundA');
                    return jp();
                });
                aroundBAdvice.and.callFake((ctxt, jp: JoinPoint) => {
                    pushData(ctxt, 'aroundB');
                    return jp();
                });

                class Test {
                    @AProperty()
                    @BProperty()
                    prop: any;
                }

                [beforeAAdvice, beforeBAdvice, aroundAAdvice, aroundBAdvice].forEach((f) =>
                    expect(f).not.toHaveBeenCalled(),
                );
                new Test().prop;
                [beforeAAdvice, beforeBAdvice, aroundAAdvice, aroundBAdvice].forEach((f) =>
                    expect(f).toHaveBeenCalled(),
                );
                expect(data.advices).toEqual(['aroundA', 'aroundB', 'beforeA', 'beforeB']);
            });
        });
        it('should be the current before advice', () => {
            beforeAAdvice.and.callFake((ctxt: BeforeContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(propertyAspectA);
            });
            beforeBAdvice.and.callFake((ctxt: BeforeContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(propertyAspectB);
            });

            class Test {
                @AProperty()
                @BProperty()
                prop: any;
            }

            [beforeAAdvice, beforeBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
            new Test().prop;
            [beforeAAdvice, beforeBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
        });
    });
    describe('on a property setter', () => {
        let propertyAspectA: any;
        let propertyAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @Order(1)
                @Before(on.property.setter.withAnnotations(AProperty))
                beforeA(ctxt: BeforeContext<any, AdviceType.CLASS>): void {
                    beforeAAdvice(ctxt);
                }

                @Order(1)
                @Around(on.property.setter.withAnnotations(AProperty))
                aroundA(ctxt: AroundContext, jp: JoinPoint): void {
                    aroundAAdvice(ctxt, jp);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Order(2)
                @Before(on.property.setter.withAnnotations(BProperty))
                beforeB(ctxt: BeforeContext<any, AdviceType.CLASS>): void {
                    beforeBAdvice(ctxt);
                }

                @Order(2)
                @Around(on.property.setter.withAnnotations(BProperty))
                aroundB(ctxt: AroundContext, jp: JoinPoint): void {
                    aroundBAdvice(ctxt, jp);
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

                beforeAAdvice.and.callFake((ctxt) => pushData(ctxt, 'beforeA'));
                beforeBAdvice.and.callFake((ctxt) => pushData(ctxt, 'beforeB'));
            });
            it('should be shared across two @Before advices on the same property', () => {
                class Test {
                    @AProperty()
                    @BProperty()
                    prop: any;
                }
                [beforeAAdvice, beforeBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                new Test().prop = 'toto';
                [beforeAAdvice, beforeBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());
                expect(data.advices).toEqual(['beforeA', 'beforeB']);
            });

            it('should not be shared across two @Before advices on different properties', () => {
                @AClass()
                class Test {
                    @AProperty()
                    prop1: any;

                    @BProperty()
                    prop2: any;
                }

                [beforeAAdvice, beforeBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                const t = new Test();
                t.prop1 = 'toto';
                t.prop2 = 'toto';
                [beforeAAdvice, beforeBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());

                expect(data.advices).toEqual(['beforeB']);
            });

            it('should be shared between a @Before and a @Around advice on the same property', () => {
                aroundAAdvice.and.callFake((ctxt, jp: JoinPoint) => {
                    pushData(ctxt, 'aroundA');
                    return jp();
                });
                aroundBAdvice.and.callFake((ctxt, jp: JoinPoint) => {
                    pushData(ctxt, 'aroundB');
                    return jp();
                });

                class Test {
                    @AProperty()
                    @BProperty()
                    prop: any;
                }
                [beforeAAdvice, beforeBAdvice, aroundAAdvice, aroundBAdvice].forEach((fn) =>
                    expect(fn).not.toHaveBeenCalled(),
                );
                new Test().prop = '';
                [beforeAAdvice, beforeBAdvice, aroundAAdvice, aroundBAdvice].forEach((fn) =>
                    expect(fn).toHaveBeenCalled(),
                );
                expect(data.advices).toEqual(['aroundA', 'aroundB', 'beforeA', 'beforeB']);
            });
        });

        it('should be the current before advice', () => {
            beforeAAdvice.and.callFake((ctxt: BeforeContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(propertyAspectA);
            });
            beforeBAdvice.and.callFake((ctxt: BeforeContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(propertyAspectB);
            });

            class Test {
                @AProperty()
                @BProperty()
                prop: any;
            }

            [beforeAAdvice, beforeBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
            new Test().prop = '';
            [beforeAAdvice, beforeBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
        });
    });
    describe('on a method', () => {
        let methodAspectA: any;
        let methodAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @Order(1)
                @Before(on.method.withAnnotations(AMethod))
                beforeA(ctxt: BeforeContext<any, AdviceType.METHOD>): void {
                    beforeAAdvice(ctxt);
                }

                @Order(1)
                @Around(on.method.withAnnotations(AMethod))
                aroundA(ctxt: AroundContext, jp: JoinPoint): void {
                    aroundAAdvice(ctxt, jp);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Order(2)
                @Before(on.method.withAnnotations(BMethod))
                beforeB(ctxt: BeforeContext<any, AdviceType.METHOD>): void {
                    beforeBAdvice(ctxt);
                }

                @Order(2)
                @Around(on.method.withAnnotations(BMethod))
                aroundB(ctxt: AroundContext, jp: JoinPoint): void {
                    aroundBAdvice(ctxt, jp);
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

                beforeAAdvice.and.callFake((ctxt) => pushData(ctxt, 'beforeA'));
                beforeBAdvice.and.callFake((ctxt) => pushData(ctxt, 'beforeB'));
            });

            it('should be shared across two @Before advices on the same method', () => {
                class Test {
                    @AMethod()
                    @BMethod()
                    someMethod(): any {}
                }
                [beforeAAdvice, beforeBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                new Test().someMethod();
                [beforeAAdvice, beforeBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());

                expect(data.advices).toEqual(['beforeA', 'beforeB']);
            });

            it('should not be shared across two @Before advices on different method', () => {
                @AClass()
                class Test {
                    @AMethod()
                    method1(): any {}

                    @BMethod()
                    method2(): any {}
                }

                [beforeAAdvice, beforeBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                const t = new Test();
                t.method1();
                t.method2();
                [beforeAAdvice, beforeBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());

                expect(data.advices).toEqual(['beforeB']);
            });

            it('should be shared between a @Before and a @Around advice on the same method', () => {
                aroundAAdvice.and.callFake((ctxt) => {
                    pushData(ctxt, 'aroundA');
                    return ctxt.joinpoint();
                });
                aroundBAdvice.and.callFake((ctxt) => {
                    pushData(ctxt, 'aroundB');
                    return ctxt.joinpoint();
                });

                class Test {
                    @AMethod()
                    @BMethod()
                    method(): any {}
                }

                new Test().method();
                expect(data.advices).toEqual(['aroundA', 'aroundB', 'beforeA', 'beforeB']);
            });
        });

        it('should be the current before advice', () => {
            beforeAAdvice.and.callFake((ctxt: BeforeContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(methodAspectA);
            });
            beforeBAdvice.and.callFake((ctxt: BeforeContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(methodAspectB);
            });

            class Test {
                @AMethod()
                @BMethod()
                method(): any {}
            }

            [beforeAAdvice, beforeBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
            new Test().method();
            [beforeAAdvice, beforeBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
        });
    });
    describe('on a parameter', () => {
        let parameterAspectA: any;
        let parameterAspectB: any;
        beforeEach(() => {
            @Aspect()
            class ParameterAspectA {
                @Order(1)
                @Before(on.parameter.withAnnotations(AParameter))
                beforeA(ctxt: BeforeContext<any, AdviceType.PARAMETER>): void {
                    beforeAAdvice(ctxt);
                }

                @Order(1)
                @Around(on.parameter.withAnnotations(AParameter))
                aroundA(ctxt: AroundContext, jp: JoinPoint): void {
                    aroundAAdvice(ctxt, jp);
                }
            }
            @Aspect()
            class ParameterAspectB {
                @Order(2)
                @Before(on.parameter.withAnnotations(BParameter))
                beforeB(ctxt: BeforeContext<any, AdviceType.PARAMETER>): void {
                    beforeBAdvice(ctxt);
                }

                @Order(2)
                @Around(on.parameter.withAnnotations(BParameter))
                aroundB(ctxt: AroundContext, jp: JoinPoint): void {
                    aroundBAdvice(ctxt, jp);
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

                beforeAAdvice.and.callFake((ctxt) => pushData(ctxt, 'beforeA'));
                beforeBAdvice.and.callFake((ctxt) => pushData(ctxt, 'beforeB'));
            });
            it('should be shared across two @Before advices on the same parameter', () => {
                class Test {
                    someMethod(@AParameter() @BParameter() param: any): any {}
                }

                new Test().someMethod('');

                expect(data.advices).toEqual(['beforeA', 'beforeB']);
            });

            it('should not be shared across two @Before advices on different parameters', () => {
                class Test {
                    someMethod(@AParameter() paramA: any, @BParameter() paramB: any): any {}
                }
                new Test().someMethod('', '');

                expect(data.advices).toEqual(['beforeA']);
            });

            it('should be shared between a @Before and a @Around advice on the same parameters', () => {
                aroundAAdvice.and.callFake((ctxt) => {
                    pushData(ctxt, 'aroundA');
                    ctxt.joinpoint();
                });
                aroundBAdvice.and.callFake((ctxt) => {
                    pushData(ctxt, 'aroundB');
                    ctxt.joinpoint();
                });

                class Test {
                    someMethod(@AParameter() @BParameter() param: any): any {}
                }

                new Test().someMethod('');
                expect(data.advices).toEqual(['aroundA', 'aroundB', 'beforeA', 'beforeB']);
            });
        });
        it('should be the current before advice', () => {
            beforeAAdvice.and.callFake((ctxt: BeforeContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(parameterAspectA);
            });
            beforeBAdvice.and.callFake((ctxt: BeforeContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(parameterAspectB);
            });

            class Test {
                someMethod(@AParameter() @BParameter() param: any): any {}
            }

            [beforeAAdvice, beforeBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
            new Test().someMethod('');
            [beforeAAdvice, beforeBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
        });
    });
});
