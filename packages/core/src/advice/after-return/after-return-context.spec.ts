import { AdviceContext, AfterContext, AfterReturnContext } from '../advice-context';
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
import { AfterReturn } from './after-return.annotation';
import { weaverContext } from '../../weaver/weaver-context';
import { Weaver } from '../../weaver/weaver';
import { JitWeaver } from '../../weaver/jit/jit-weaver';
import { AdviceType } from '../../annotation/annotation.types';
import { After } from '../after/after.annotation';

describe('AfterReturnContext', () => {
    let weaver: Weaver;
    let afterReturnAAdvice = jasmine.createSpy('afterReturnAAdvice');
    let afterReturnBAdvice = jasmine.createSpy('afterReturnBAdvice');
    let afterAAdvice = jasmine.createSpy('afterAAdvice');
    let afterBAdvice = jasmine.createSpy('afterBAdvice');

    beforeEach(() => {
        weaverContext.setWeaver((weaver = new JitWeaver()));
        afterReturnAAdvice = jasmine.createSpy('afterReturnAAdvice');
        afterReturnBAdvice = jasmine.createSpy('afterReturnBAdvice');
        afterAAdvice = jasmine.createSpy('afterAAdvice');
        afterBAdvice = jasmine.createSpy('afterBAdvice');
    });

    describe('on a class', () => {
        let classAspectB: any;
        beforeEach(() => {
            @Aspect()
            class ClassAspectA {
                @AfterReturn(on.class.withAnnotations(AClass), { priority: 10 })
                afterReturnA(ctxt: AfterReturnContext<any, AdviceType.PROPERTY>): void {
                    afterReturnAAdvice(ctxt);
                }

                @After(on.class.withAnnotations(AClass), { priority: 10 })
                afterA(ctxt: AfterContext<any, AdviceType.PROPERTY>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class ClassAspectB {
                @AfterReturn(on.class.withAnnotations(BClass), { priority: 9 })
                afterReturnB(ctxt: AfterReturnContext<any, AdviceType.PROPERTY>): void {
                    afterReturnBAdvice(ctxt);
                }

                @After(on.class.withAnnotations(BClass), { priority: 9 })
                afterB(ctxt: AfterContext<any, AdviceType.PROPERTY>): void {
                    afterBAdvice(ctxt);
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

            it('should not shared across two @AfterReturn advices on different classes', () => {
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
    });

    describe('on a property', () => {
        let propertyAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @AfterReturn(on.property.withAnnotations(AProperty), { priority: 10 })
                afterReturnA(ctxt: AfterReturnContext<any, AdviceType.CLASS>): void {
                    afterReturnAAdvice(ctxt);
                }

                @After(on.property.withAnnotations(AProperty), { priority: 10 })
                afterA(ctxt: AfterContext<any, AdviceType.CLASS>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @AfterReturn(on.property.withAnnotations(BProperty), { priority: 9 })
                afterReturnB(ctxt: AfterReturnContext<any, AdviceType.CLASS>): void {
                    afterReturnBAdvice(ctxt);
                }

                @After(on.property.withAnnotations(BProperty), { priority: 9 })
                afterB(ctxt: AfterContext<any, AdviceType.CLASS>): void {
                    afterBAdvice(ctxt);
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

            it('should not shared across two @AfterReturn advices on different properties', () => {
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
    });

    describe('on a property setter', () => {
        let propertyAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @AfterReturn(on.property.setter.withAnnotations(AProperty), { priority: 10 })
                afterReturnA(ctxt: AfterReturnContext<any, AdviceType.CLASS>): void {
                    afterReturnAAdvice(ctxt);
                }

                @After(on.property.setter.withAnnotations(AProperty), { priority: 10 })
                afterA(ctxt: AfterContext<any, AdviceType.CLASS>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @AfterReturn(on.property.setter.withAnnotations(BProperty), { priority: 9 })
                afterReturnB(ctxt: AfterReturnContext<any, AdviceType.CLASS>): void {
                    afterReturnBAdvice(ctxt);
                }

                @After(on.property.setter.withAnnotations(BProperty), { priority: 9 })
                afterB(ctxt: AfterContext<any, AdviceType.CLASS>): void {
                    afterBAdvice(ctxt);
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

            it('should not shared across two @AfterReturn advices on different properties', () => {
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
    });

    describe('on a method', () => {
        let methodAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @AfterReturn(on.method.withAnnotations(AMethod), { priority: 10 })
                afterReturnA(ctxt: AfterReturnContext<any, AdviceType.METHOD>): void {
                    afterReturnAAdvice(ctxt);
                }

                @After(on.method.withAnnotations(AMethod), { priority: 10 })
                afterA(ctxt: AfterContext<any, AdviceType.METHOD>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @AfterReturn(on.method.withAnnotations(BMethod), { priority: 9 })
                afterReturnB(ctxt: AfterReturnContext<any, AdviceType.METHOD>): void {
                    afterReturnBAdvice(ctxt);
                }

                @After(on.method.withAnnotations(BMethod), { priority: 9 })
                afterB(ctxt: AfterContext<any, AdviceType.METHOD>): void {
                    afterBAdvice(ctxt);
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

            it('should not shared across two @AfterReturn advices on different method', () => {
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
    });

    describe('on a parameter', () => {
        let parameterAspectB: any;
        beforeEach(() => {
            @Aspect()
            class ParameterAspectA {
                @AfterReturn(on.parameter.withAnnotations(AParameter), { priority: 10 })
                afterReturnA(ctxt: AfterReturnContext<any, AdviceType.PARAMETER>): void {
                    afterReturnAAdvice(ctxt);
                }

                @After(on.parameter.withAnnotations(AParameter), { priority: 10 })
                afterA(ctxt: AfterContext<any, AdviceType.PARAMETER>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class ParameterAspectB {
                @AfterReturn(on.parameter.withAnnotations(BParameter), { priority: 9 })
                afterReturnB(ctxt: AfterReturnContext<any, AdviceType.PARAMETER>): void {
                    afterReturnBAdvice(ctxt);
                }

                @After(on.parameter.withAnnotations(BParameter), { priority: 9 })
                afterB(ctxt: AfterContext<any, AdviceType.PARAMETER>): void {
                    afterBAdvice(ctxt);
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

            it('should not shared across two @AfterReturn advices on different parameters', () => {
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
    });
});
