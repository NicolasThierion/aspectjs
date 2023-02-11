import { AfterReturn, Around, Aspect, Order } from '@aspectjs/core/annotations';
import { _AClass, _AMethod, _AParameter, _AProperty, _BClass, _BMethod, _BParameter, _BProperty } from '@root/testing';
import { setupAspectTestingContext } from '@aspectjs/core/testing';
import { Weaver } from '@aspectjs/weaver';
import { AroundContext } from './around.context';
import { AdviceType } from '../../advice/advice.type';
import { AfterReturnContext } from '../after-return/after-return.context';
import { JoinPoint } from '../../advice/joinpoint';
import { on } from '../../advice/pointcut';
import { AdviceContext } from '../../advice/advice.context.type';

describe('AroundContext', () => {
    let weaver: Weaver;
    let aroundAAdvice = jasmine.createSpy('aroundAAdvice');
    let aroundBAdvice = jasmine.createSpy('aroundBAdvice');
    let afterReturnAAdvice = jasmine.createSpy('afterReturnAAdvice');
    let afterReturnBAdvice = jasmine.createSpy('afterReturnBAdvice');

    beforeEach(() => {
        weaver = setupAspectTestingContext().weaverContext.getWeaver();
        aroundAAdvice = jasmine.createSpy('aroundAAdvice');
        aroundBAdvice = jasmine.createSpy('aroundBAdvice');
        afterReturnAAdvice = jasmine.createSpy('afterReturnAAdvice');
        afterReturnBAdvice = jasmine.createSpy('afterReturnBAdvice');
    });

    describe('for a class', () => {
        let classAspectA: any;
        let classAspectB: any;
        beforeEach(() => {
            @Aspect()
            class ClassAspectA {
                @Order(10)
                @Around(on.class.withAnnotations(_AClass))
                aroundA(ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint): void {
                    aroundAAdvice(ctxt, jp);
                }

                @Order(10)
                @AfterReturn(on.class.withAnnotations(_AClass))
                afterReturnA(ctxt: AfterReturnContext<any, AdviceType.CLASS>, jp: JoinPoint): void {
                    afterReturnAAdvice(ctxt, jp);
                }
            }
            @Aspect()
            class ClassAspectB {
                @Order(11)
                @Around(on.class.withAnnotations(_BClass))
                aroundB(ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint): void {
                    aroundBAdvice(ctxt, jp);
                }

                @Order(11)
                @AfterReturn(on.class.withAnnotations(_BClass))
                afterReturnB(ctxt: AfterReturnContext<any, AdviceType.CLASS>, jp: JoinPoint): void {
                    afterReturnBAdvice(ctxt, jp);
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

                aroundAAdvice.and.callFake((ctxt) => {
                    pushData(ctxt, 'aroundA');
                    return ctxt.joinpoint();
                });
                aroundBAdvice.and.callFake((ctxt) => {
                    pushData(ctxt, 'aroundB');
                    return ctxt.joinpoint();
                });
            });
            it('should be shared across two @Around advices on the same class', () => {
                @_AClass()
                @_BClass()
                class Test {}
                new Test();

                expect(data.advices).toEqual(['aroundA', 'aroundB']);
            });

            it('should not be shared across two @Around advices on different classes', () => {
                @_AClass()
                class Test1 {}
                new Test1();
                expect(data.advices).toEqual(['aroundA']);
                @_BClass()
                class Test2 {}
                new Test2();

                expect(data.advices).toEqual(['aroundB']);
            });

            it('should be shared between a @Around and a @AfterReturn advice on the same class', () => {
                afterReturnAAdvice.and.callFake((ctxt: AfterReturnContext<any, any>) => pushData(ctxt, 'afterReturnA'));
                afterReturnBAdvice.and.callFake((ctxt: AfterReturnContext<any, any>) => pushData(ctxt, 'afterReturnB'));

                @_AClass()
                @_BClass()
                class Test {}
                new Test();
                expect(data.advices).toEqual(['aroundA', 'aroundB', 'afterReturnB', 'afterReturnA']);
            });
        });

        describe('attribute ctxt.instance', () => {
            let instanceBefore: any;
            let instanceAfter: any;
            beforeEach(() => {
                aroundAAdvice = jasmine
                    .createSpy('aroundAdvice')
                    .and.callFake((ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                        instanceBefore = ctxt.instance;
                        jp();
                        instanceAfter = ctxt.instance;
                    });
            });

            describe('before the joinpoint is called', () => {
                it('should be null', () => {
                    @_AClass()
                    class A {
                        labels = ['A'];
                    }

                    new A();
                    expect(instanceBefore).toBeNull();
                    expect(instanceAfter).toEqual(jasmine.any(A));
                });
            });
        });

        it('should be the current around advice', () => {
            aroundAAdvice.and.callFake((ctxt: AroundContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(classAspectA);
                ctxt.joinpoint();
            });
            aroundBAdvice.and.callFake((ctxt: AroundContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(classAspectB);
                ctxt.joinpoint();
            });

            @_AClass()
            @_BClass()
            class A {}

            [aroundAAdvice, aroundBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
            new A();
            [aroundAAdvice, aroundBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
        });
    });

    describe('on a property', () => {
        let propertyAspectA: any;
        let propertyAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @Order(10)
                @Around(on.property.withAnnotations(_AProperty))
                aroundA(ctxt: AroundContext<any, AdviceType.PROPERTY>, jp: JoinPoint): void {
                    aroundAAdvice(ctxt, jp);
                }

                @Order(10)
                @AfterReturn(on.property.withAnnotations(_AProperty))
                afterReturnA(ctxt: AfterReturnContext<any, AdviceType.PROPERTY>, jp: JoinPoint): void {
                    afterReturnAAdvice(ctxt, jp);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Order(11)
                @Around(on.property.withAnnotations(_BProperty))
                aroundB(ctxt: AroundContext<any, AdviceType.PROPERTY>): void {
                    aroundBAdvice(ctxt);
                }

                @Order(11)
                @AfterReturn(on.property.withAnnotations(_BProperty))
                afterReturnB(ctxt: AfterReturnContext<any, AdviceType.PROPERTY>): void {
                    afterReturnBAdvice(ctxt);
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

                aroundAAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                    pushData(ctxt, 'aroundA');
                    return ctxt.joinpoint();
                });
                aroundBAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                    pushData(ctxt, 'aroundB');
                    return ctxt.joinpoint();
                });
            });
            it('should be shared across two @Around advices on the same property', () => {
                class Test {
                    @_AProperty()
                    @_BProperty()
                    prop: any;
                }

                [aroundAAdvice, aroundBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
                new Test().prop;
                [aroundAAdvice, aroundBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
                expect(data.advices).toEqual(['aroundA', 'aroundB']);
            });

            it('should not be shared across two @Around advices on different properties', () => {
                @_AClass()
                class Test {
                    @_AProperty()
                    prop1: any;

                    @_BProperty()
                    prop2: any;
                }
                const t = new Test();

                [aroundAAdvice, aroundBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
                t.prop1;
                t.prop2;
                [aroundAAdvice, aroundBAdvice].forEach((f) => expect(f).toHaveBeenCalled());

                expect(data.advices).toEqual(['aroundB']);
            });

            it('should be shared between a @Around and a @AfterReturn advice on the same property', () => {
                afterReturnAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterReturnA'));
                afterReturnBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterReturnB'));

                class Test {
                    @_AProperty()
                    @_BProperty()
                    prop: any;
                }

                [aroundAAdvice, aroundBAdvice, afterReturnAAdvice, afterReturnBAdvice].forEach((f) =>
                    expect(f).not.toHaveBeenCalled(),
                );
                new Test().prop;
                [aroundAAdvice, aroundBAdvice, afterReturnAAdvice, afterReturnBAdvice].forEach((f) =>
                    expect(f).toHaveBeenCalled(),
                );
                expect(data.advices).toEqual(['aroundA', 'aroundB', 'afterReturnB', 'afterReturnA']);
            });

            it('should be the current around advice', () => {
                aroundAAdvice.and.callFake((ctxt: AroundContext) => {
                    expect(ctxt.advice.aspect.constructor).toEqual(propertyAspectA);
                    ctxt.joinpoint();
                });
                aroundBAdvice.and.callFake((ctxt: AroundContext) => {
                    expect(ctxt.advice.aspect.constructor).toEqual(propertyAspectB);
                    ctxt.joinpoint();
                });

                class Test {
                    @_AProperty()
                    @_BProperty()
                    prop: any;
                }

                [aroundAAdvice, aroundBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
                new Test().prop;
                [aroundAAdvice, aroundBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
            });
        });
    });

    describe('on a property setter', () => {
        let propertyAspectA: any;
        let propertyAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @Order(10)
                @Around(on.property.setter.withAnnotations(_AProperty))
                aroundA(ctxt: AroundContext<any, AdviceType.CLASS>): void {
                    aroundAAdvice(ctxt);
                }

                @Order(10)
                @AfterReturn(on.property.setter.withAnnotations(_AProperty))
                afterReturnA(ctxt: AfterReturnContext<any, AdviceType.CLASS>): void {
                    afterReturnAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Order(11)
                @Around(on.property.setter.withAnnotations(_BProperty))
                aroundB(ctxt: AroundContext<any, AdviceType.CLASS>): void {
                    aroundBAdvice(ctxt);
                }

                @Order(11)
                @AfterReturn(on.property.setter.withAnnotations(_BProperty))
                afterReturnB(ctxt: AfterReturnContext<any, AdviceType.CLASS>): void {
                    afterReturnBAdvice(ctxt);
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

                aroundAAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                    pushData(ctxt, 'aroundA');
                    return ctxt.joinpoint();
                });
                aroundBAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                    pushData(ctxt, 'aroundB');
                    return ctxt.joinpoint();
                });
            });
            it('should be shared across two @Around advices on the same property', () => {
                class Test {
                    @_AProperty()
                    @_BProperty()
                    prop: any;
                }
                [aroundAAdvice, aroundBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                new Test().prop = 'toto';
                [aroundAAdvice, aroundBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());
                expect(data.advices).toEqual(['aroundA', 'aroundB']);
            });

            it('should not be shared across two @Around advices on different properties', () => {
                @_AClass()
                class Test {
                    @_AProperty()
                    prop1: any;

                    @_BProperty()
                    prop2: any;
                }

                [aroundAAdvice, aroundBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                const t = new Test();
                t.prop1 = 'toto';
                t.prop2 = 'toto';
                [aroundAAdvice, aroundBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());

                expect(data.advices).toEqual(['aroundB']);
            });

            it('should be shared between a @Around and a @AfterReturn advice on the same property', () => {
                afterReturnAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterReturnA'));
                afterReturnBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterReturnB'));

                class Test {
                    @_AProperty()
                    @_BProperty()
                    prop: any;
                }
                [aroundAAdvice, aroundBAdvice, afterReturnAAdvice, afterReturnBAdvice].forEach((fn) =>
                    expect(fn).not.toHaveBeenCalled(),
                );
                new Test().prop = '';
                [aroundAAdvice, aroundBAdvice, afterReturnAAdvice, afterReturnBAdvice].forEach((fn) =>
                    expect(fn).toHaveBeenCalled(),
                );
                expect(data.advices).toEqual(['aroundA', 'aroundB', 'afterReturnB', 'afterReturnA']);
            });

            it('should be the current around advice', () => {
                aroundAAdvice.and.callFake((ctxt: AroundContext) => {
                    expect(ctxt.advice.aspect.constructor).toEqual(propertyAspectA);
                    ctxt.joinpoint();
                });
                aroundBAdvice.and.callFake((ctxt: AroundContext) => {
                    expect(ctxt.advice.aspect.constructor).toEqual(propertyAspectB);
                    ctxt.joinpoint();
                });

                class Test {
                    @_AProperty()
                    @_BProperty()
                    prop: any;
                }

                [aroundAAdvice, aroundBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
                new Test().prop = '';
                [aroundAAdvice, aroundBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
            });
        });
    });
    describe('on a method', () => {
        let methodAspectA: any;
        let methodAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @Order(10)
                @Around(on.method.withAnnotations(_AMethod))
                aroundA(ctxt: AroundContext<any, AdviceType.METHOD>): void {
                    aroundAAdvice(ctxt);
                }

                @Order(10)
                @AfterReturn(on.method.withAnnotations(_AMethod))
                afterReturnA(ctxt: AfterReturnContext<any, AdviceType.METHOD>): void {
                    afterReturnAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Order(11)
                @Around(on.method.withAnnotations(_BMethod))
                aroundB(ctxt: AroundContext<any, AdviceType.METHOD>): void {
                    aroundBAdvice(ctxt);
                }

                @Order(11)
                @AfterReturn(on.method.withAnnotations(_BMethod))
                afterReturnB(ctxt: AfterReturnContext<any, AdviceType.METHOD>): void {
                    afterReturnBAdvice(ctxt);
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

                aroundAAdvice.and.callFake((ctxt) => {
                    pushData(ctxt, 'aroundA');
                    return ctxt.joinpoint();
                });
                aroundBAdvice.and.callFake((ctxt) => {
                    pushData(ctxt, 'aroundB');
                    return ctxt.joinpoint();
                });
            });

            it('should be shared across two @Around advices on the same method', () => {
                class Test {
                    @_AMethod()
                    @_BMethod()
                    someMethod(): any {}
                }
                [aroundAAdvice, aroundBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                new Test().someMethod();
                [aroundAAdvice, aroundBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());

                expect(data.advices).toEqual(['aroundA', 'aroundB']);
            });

            it('should not be shared across two @Around advices on different method', () => {
                @_AClass()
                class Test {
                    @_AMethod()
                    method1(): any {}

                    @_BMethod()
                    method2(): any {}
                }

                [aroundAAdvice, aroundBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                const t = new Test();
                t.method1();
                t.method2();
                [aroundAAdvice, aroundBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());

                expect(data.advices).toEqual(['aroundB']);
            });

            it('should be shared between a @Around and a @AfterReturn advice on the same method', () => {
                afterReturnAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterReturnA'));
                afterReturnBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterReturnB'));

                class Test {
                    @_AMethod()
                    @_BMethod()
                    method(): any {}
                }

                new Test().method();
                expect(data.advices).toEqual(['aroundA', 'aroundB', 'afterReturnB', 'afterReturnA']);
            });
        });

        it('should be the current around advice', () => {
            aroundAAdvice.and.callFake((ctxt: AroundContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(methodAspectA);
                ctxt.joinpoint();
            });
            aroundBAdvice.and.callFake((ctxt: AroundContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(methodAspectB);
                ctxt.joinpoint();
            });

            class Test {
                @_AMethod()
                @_BMethod()
                method(): any {}
            }

            [aroundAAdvice, aroundBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
            new Test().method();
            [aroundAAdvice, aroundBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
        });
    });
    describe('on a parameter', () => {
        let parameterAspectA: any;
        let parameterAspectB: any;
        beforeEach(() => {
            @Aspect()
            class ParameterAspectA {
                @Order(10)
                @Around(on.parameter.withAnnotations(_AParameter))
                aroundA(ctxt: AroundContext<any, AdviceType.PARAMETER>): void {
                    aroundAAdvice(ctxt);
                }

                @Order(10)
                @AfterReturn(on.parameter.withAnnotations(_AParameter))
                afterReturnA(ctxt: AfterReturnContext<any, AdviceType.PARAMETER>): void {
                    afterReturnAAdvice(ctxt);
                }
            }
            @Aspect()
            class ParameterAspectB {
                @Order(11)
                @Around(on.parameter.withAnnotations(_BParameter))
                aroundB(ctxt: AroundContext<any, AdviceType.PARAMETER>): void {
                    aroundBAdvice(ctxt);
                }

                @Order(11)
                @AfterReturn(on.parameter.withAnnotations(_BParameter))
                afterReturnB(ctxt: AfterReturnContext<any, AdviceType.PARAMETER>): void {
                    afterReturnBAdvice(ctxt);
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

                aroundAAdvice.and.callFake((ctxt) => {
                    pushData(ctxt, 'aroundA');
                    return ctxt.joinpoint();
                });
                aroundBAdvice.and.callFake((ctxt) => {
                    pushData(ctxt, 'aroundB');
                    return ctxt.joinpoint();
                });
            });
            it('should be shared across two @Around advices on the same parameter', () => {
                class Test {
                    someMethod(@_AParameter() @_BParameter() param: any): any {}
                }

                new Test().someMethod('');

                expect(data.advices).toEqual(['aroundA', 'aroundB']);
            });

            it('should not be shared across two @Around advices on different parameters', () => {
                class Test {
                    someMethod(@_AParameter() paramA: any, @_BParameter() paramB: any): any {}
                }
                new Test().someMethod('', '');

                expect(data.advices).toEqual(['aroundA']);
            });

            it('should be shared between a @Around and a @AfterReturn advice on the same parameters', () => {
                afterReturnAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterReturnA'));
                afterReturnBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterReturnB'));

                class Test {
                    someMethod(@_AParameter() @_BParameter() param: any): any {}
                }

                new Test().someMethod('');
                expect(data.advices).toEqual(['aroundA', 'aroundB', 'afterReturnB', 'afterReturnA']);
            });
        });
        it('should be the current around advice', () => {
            aroundAAdvice.and.callFake((ctxt: AroundContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(parameterAspectA);
                ctxt.joinpoint();
            });
            aroundBAdvice.and.callFake((ctxt: AroundContext) => {
                expect(ctxt.advice.aspect.constructor).toEqual(parameterAspectB);
                ctxt.joinpoint();
            });

            class Test {
                someMethod(@_AParameter() @_BParameter() param: any): any {}
            }

            [aroundAAdvice, aroundBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
            new Test().someMethod('');
            [aroundAAdvice, aroundBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
        });
    });
});
