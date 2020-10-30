import { AdviceContext, AfterReturnContext, AroundContext } from '../advice-context';
import { Aspect } from '../aspect';
import { on } from '../pointcut';
import {
    AClass,
    AMethod,
    AParameter,
    AProperty,
    BClass,
    BMethod,
    BParameter,
    BProperty,
} from '../../../testing/src/helpers';
import { Around } from './around.decorator';
import { weaverContext } from '../../weaver/weaver-context';
import { Weaver } from '../../weaver/weaver';
import { JitWeaver } from '../../weaver/jit/jit-weaver';
import { AfterReturn } from '../after-return/after-return.decorator';
import { AnnotationType } from '../../annotation/annotation.types';

describe('AroundContext', () => {
    let weaver: Weaver;
    let aroundAAdvice = jasmine.createSpy('aroundAAdvice');
    let aroundBAdvice = jasmine.createSpy('aroundBAdvice');
    let afterReturnAAdvice = jasmine.createSpy('afterReturnAAdvice');
    let afterReturnBAdvice = jasmine.createSpy('afterReturnBAdvice');

    beforeEach(() => {
        weaverContext.setWeaver((weaver = new JitWeaver()));
        aroundAAdvice = jasmine.createSpy('aroundAAdvice');
        aroundBAdvice = jasmine.createSpy('aroundBAdvice');
        afterReturnAAdvice = jasmine.createSpy('afterReturnAAdvice');
        afterReturnBAdvice = jasmine.createSpy('afterReturnBAdvice');
    });

    describe('on a class', () => {
        let classAspectB: any;
        beforeEach(() => {
            @Aspect()
            class ClassAspectA {
                @Around(on.class.withAnnotations(AClass), { priority: 10 })
                aroundA(ctxt: AroundContext<any, AnnotationType.PROPERTY>): void {
                    aroundAAdvice(ctxt);
                }

                @AfterReturn(on.class.withAnnotations(AClass), { priority: 10 })
                afterReturnA(ctxt: AfterReturnContext<any, AnnotationType.PROPERTY>): void {
                    afterReturnAAdvice(ctxt);
                }
            }
            @Aspect()
            class ClassAspectB {
                @Around(on.class.withAnnotations(BClass), { priority: 9 })
                aroundB(ctxt: AroundContext<any, AnnotationType.PROPERTY>): void {
                    aroundBAdvice(ctxt);
                }

                @AfterReturn(on.class.withAnnotations(BClass), { priority: 9 })
                afterReturnB(ctxt: AfterReturnContext<any, AnnotationType.PROPERTY>): void {
                    afterReturnBAdvice(ctxt);
                }
            }
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
                @AClass()
                @BClass()
                class Test {}
                new Test();

                expect(data.advices).toEqual(['aroundA', 'aroundB']);
            });

            it('should not shared across two @Around advices on different classes', () => {
                @AClass()
                class Test1 {}
                new Test1();
                expect(data.advices).toEqual(['aroundA']);
                @BClass()
                class Test2 {}
                new Test2();

                expect(data.advices).toEqual(['aroundB']);
            });

            it('should be shared between a @Around and a @AfterReturn advice on the same class', () => {
                afterReturnAAdvice.and.callFake((ctxt: AfterReturnContext<any, any>) => pushData(ctxt, 'afterReturnA'));
                afterReturnBAdvice.and.callFake((ctxt: AfterReturnContext<any, any>) => pushData(ctxt, 'afterReturnB'));

                @AClass()
                @BClass()
                class Test {}
                new Test();
                expect(data.advices).toEqual(['aroundA', 'aroundB', 'afterReturnA', 'afterReturnB']);
            });
        });
    });

    describe('on a property', () => {
        let propertyAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @Around(on.property.withAnnotations(AProperty), { priority: 10 })
                aroundA(ctxt: AroundContext<any, AnnotationType.CLASS>): void {
                    aroundAAdvice(ctxt);
                }

                @AfterReturn(on.property.withAnnotations(AProperty), { priority: 10 })
                afterReturnA(ctxt: AfterReturnContext<any, AnnotationType.CLASS>): void {
                    afterReturnAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Around(on.property.withAnnotations(BProperty), { priority: 9 })
                aroundB(ctxt: AroundContext<any, AnnotationType.CLASS>): void {
                    aroundBAdvice(ctxt);
                }

                @AfterReturn(on.property.withAnnotations(BProperty), { priority: 9 })
                afterReturnB(ctxt: AfterReturnContext<any, AnnotationType.CLASS>): void {
                    afterReturnBAdvice(ctxt);
                }
            }
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
                    @AProperty()
                    @BProperty()
                    prop: any;
                }

                [aroundAAdvice, aroundBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
                new Test().prop;
                [aroundAAdvice, aroundBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
                expect(data.advices).toEqual(['aroundA', 'aroundB']);
            });

            it('should not shared across two @Around advices on different properties', () => {
                @AClass()
                class Test {
                    @AProperty()
                    prop1: any;

                    @BProperty()
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
                    @AProperty()
                    @BProperty()
                    prop: any;
                }

                [aroundAAdvice, aroundBAdvice, afterReturnAAdvice, afterReturnBAdvice].forEach((f) =>
                    expect(f).not.toHaveBeenCalled(),
                );
                new Test().prop;
                [aroundAAdvice, aroundBAdvice, afterReturnAAdvice, afterReturnBAdvice].forEach((f) =>
                    expect(f).toHaveBeenCalled(),
                );
                expect(data.advices).toEqual(['aroundA', 'aroundB', 'afterReturnA', 'afterReturnB']);
            });
        });
    });

    describe('on a property setter', () => {
        let propertyAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @Around(on.property.setter.withAnnotations(AProperty), { priority: 10 })
                aroundA(ctxt: AroundContext<any, AnnotationType.CLASS>): void {
                    aroundAAdvice(ctxt);
                }

                @AfterReturn(on.property.setter.withAnnotations(AProperty), { priority: 10 })
                afterReturnA(ctxt: AfterReturnContext<any, AnnotationType.CLASS>): void {
                    afterReturnAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Around(on.property.setter.withAnnotations(BProperty), { priority: 9 })
                aroundB(ctxt: AroundContext<any, AnnotationType.CLASS>): void {
                    aroundBAdvice(ctxt);
                }

                @AfterReturn(on.property.setter.withAnnotations(BProperty), { priority: 9 })
                afterReturnB(ctxt: AfterReturnContext<any, AnnotationType.CLASS>): void {
                    afterReturnBAdvice(ctxt);
                }
            }
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
                    @AProperty()
                    @BProperty()
                    prop: any;
                }
                [aroundAAdvice, aroundBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                new Test().prop = 'toto';
                [aroundAAdvice, aroundBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());
                expect(data.advices).toEqual(['aroundA', 'aroundB']);
            });

            it('should not shared across two @Around advices on different properties', () => {
                @AClass()
                class Test {
                    @AProperty()
                    prop1: any;

                    @BProperty()
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
                    @AProperty()
                    @BProperty()
                    prop: any;
                }
                [aroundAAdvice, aroundBAdvice, afterReturnAAdvice, afterReturnBAdvice].forEach((fn) =>
                    expect(fn).not.toHaveBeenCalled(),
                );
                new Test().prop = '';
                [aroundAAdvice, aroundBAdvice, afterReturnAAdvice, afterReturnBAdvice].forEach((fn) =>
                    expect(fn).toHaveBeenCalled(),
                );
                expect(data.advices).toEqual(['aroundA', 'aroundB', 'afterReturnA', 'afterReturnB']);
            });
        });
    });
    describe('on a method', () => {
        let methodAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @Around(on.method.withAnnotations(AMethod), { priority: 10 })
                aroundA(ctxt: AroundContext<any, AnnotationType.METHOD>): void {
                    aroundAAdvice(ctxt);
                }

                @AfterReturn(on.method.withAnnotations(AMethod), { priority: 10 })
                afterReturnA(ctxt: AfterReturnContext<any, AnnotationType.METHOD>): void {
                    afterReturnAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Around(on.method.withAnnotations(BMethod), { priority: 9 })
                aroundB(ctxt: AroundContext<any, AnnotationType.METHOD>): void {
                    aroundBAdvice(ctxt);
                }

                @AfterReturn(on.method.withAnnotations(BMethod), { priority: 9 })
                afterReturnB(ctxt: AfterReturnContext<any, AnnotationType.METHOD>): void {
                    afterReturnBAdvice(ctxt);
                }
            }
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
                    @AMethod()
                    @BMethod()
                    someMethod(): any {}
                }
                [aroundAAdvice, aroundBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                new Test().someMethod();
                [aroundAAdvice, aroundBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());

                expect(data.advices).toEqual(['aroundA', 'aroundB']);
            });

            it('should not shared across two @Around advices on different method', () => {
                @AClass()
                class Test {
                    @AMethod()
                    method1(): any {}

                    @BMethod()
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
                    @AMethod()
                    @BMethod()
                    method(): any {}
                }

                new Test().method();
                expect(data.advices).toEqual(['aroundA', 'aroundB', 'afterReturnA', 'afterReturnB']);
            });
        });
    });
    describe('on a parameter', () => {
        let parameterAspectB: any;
        beforeEach(() => {
            @Aspect()
            class ParameterAspectA {
                @Around(on.parameter.withAnnotations(AParameter), { priority: 10 })
                aroundA(ctxt: AroundContext<any, AnnotationType.PARAMETER>): void {
                    aroundAAdvice(ctxt);
                }

                @AfterReturn(on.parameter.withAnnotations(AParameter), { priority: 10 })
                afterReturnA(ctxt: AfterReturnContext<any, AnnotationType.PARAMETER>): void {
                    afterReturnAAdvice(ctxt);
                }
            }
            @Aspect()
            class ParameterAspectB {
                @Around(on.parameter.withAnnotations(BParameter), { priority: 9 })
                aroundB(ctxt: AroundContext<any, AnnotationType.PARAMETER>): void {
                    aroundBAdvice(ctxt);
                }

                @AfterReturn(on.parameter.withAnnotations(BParameter), { priority: 9 })
                afterReturnB(ctxt: AfterReturnContext<any, AnnotationType.PARAMETER>): void {
                    afterReturnBAdvice(ctxt);
                }
            }
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
                    someMethod(@AParameter() @BParameter() param: any): any {}
                }

                new Test().someMethod('');

                expect(data.advices).toEqual(['aroundA', 'aroundB']);
            });

            it('should not shared across two @Around advices on different parameters', () => {
                class Test {
                    someMethod(@AParameter() paramA: any, @BParameter() paramB: any): any {}
                }
                new Test().someMethod('', '');

                expect(data.advices).toEqual(['aroundA']);
            });

            it('should be shared between a @Around and a @AfterReturn advice on the same parameters', () => {
                afterReturnAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterReturnA'));
                afterReturnBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterReturnB'));

                class Test {
                    someMethod(@AParameter() @BParameter() param: any): any {}
                }

                new Test().someMethod('');
                expect(data.advices).toEqual(['aroundA', 'aroundB', 'afterReturnA', 'afterReturnB']);
            });
        });
    });
});
