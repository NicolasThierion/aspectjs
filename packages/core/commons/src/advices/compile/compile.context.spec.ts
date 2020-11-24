import { Aspect, Before, Compile, Order } from '@aspectjs/core/annotations';
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
import { AdviceContext, AdviceType } from '../types';
import { CompileContext } from './compile.context';

describe('CompileContext', () => {
    let weaver: Weaver;
    let compileAAdvice = jasmine.createSpy('compileAAdvice');
    let compileBAdvice = jasmine.createSpy('compileBAdvice');
    let beforeAAdvice = jasmine.createSpy('beforeAAdvice');
    let beforeBAdvice = jasmine.createSpy('beforeBAdvice');

    beforeEach(() => {
        weaver = setupTestingWeaverContext().getWeaver();
        compileAAdvice = jasmine.createSpy('compileAAdvice');
        compileBAdvice = jasmine.createSpy('compileBAdvice');
        beforeAAdvice = jasmine.createSpy('beforeAAdvice');
        beforeBAdvice = jasmine.createSpy('beforeBAdvice');
    });

    describe('on a class', () => {
        let classAspectA: any;
        let classAspectB: any;
        beforeEach(() => {
            @Aspect()
            class ClassAspectA {
                @Order(1)
                @Compile(on.class.withAnnotations(AClass))
                compileA(ctxt: CompileContext<any, AdviceType.PROPERTY>) {
                    compileAAdvice(ctxt);
                }

                @Order(1)
                @Before(on.class.withAnnotations(AClass))
                beforeA(ctxt: CompileContext<any, AdviceType.PROPERTY>) {
                    beforeAAdvice(ctxt);
                }
            }
            @Aspect()
            class ClassAspectB {
                @Order(2)
                @Compile(on.class.withAnnotations(BClass))
                compileB(ctxt: CompileContext<any, AdviceType.PROPERTY>) {
                    compileBAdvice(ctxt);
                }

                @Order(2)
                @Before(on.class.withAnnotations(BClass))
                beforeB(ctxt: CompileContext<any, AdviceType.PROPERTY>) {
                    beforeBAdvice(ctxt);
                }
            }
            classAspectA = ClassAspectA;
            classAspectB = ClassAspectB;
            weaver.enable(new ClassAspectA(), new ClassAspectB());
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

                compileAAdvice.and.callFake((ctxt) => pushData(ctxt, 'compileA'));
                compileBAdvice.and.callFake((ctxt) => pushData(ctxt, 'compileB'));

                beforeAAdvice.and.callFake((ctxt) => pushData(ctxt, 'beforeA'));
                beforeBAdvice.and.callFake((ctxt) => pushData(ctxt, 'beforeB'));
            });
            it('should be shared across two @Compile advices on the same class', () => {
                @AClass()
                @BClass()
                class Test {}

                expect(data.advices).toEqual(['compileA', 'compileB']);
            });

            it('should not be shared across two @Compile advices on different classes', () => {
                @AClass()
                class Test1 {}

                expect(data.advices).toEqual(['compileA']);
                @BClass()
                class Test2 {}

                expect(data.advices).toEqual(['compileB']);
            });

            it('should be shared between a @Compile and a @Before advice on the same class', () => {
                @AClass()
                @BClass()
                class Test {}
                expect(data.advices).toEqual(['compileA', 'compileB']);
                new Test();
                expect(data.advices).toEqual(['compileA', 'compileB', 'beforeA', 'beforeB']);
            });
        });
        describe('attribute "ctxt.advice"', () => {
            it('should be the current compile advice', () => {
                compileAAdvice.and.callFake((ctxt: CompileContext) => {
                    expect(ctxt.advice.aspect.constructor).toEqual(classAspectA);
                });
                compileBAdvice.and.callFake((ctxt: CompileContext) => {
                    expect(ctxt.advice.aspect.constructor).toEqual(classAspectB);
                });

                @AClass()
                @BClass()
                class Test {}
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
                @Compile(on.property.withAnnotations(AProperty))
                compileA(ctxt: CompileContext<any, AdviceType.CLASS>) {
                    compileAAdvice(ctxt);
                }

                @Order(1)
                @Before(on.property.withAnnotations(AProperty))
                beforeA(ctxt: CompileContext<any, AdviceType.CLASS>) {
                    beforeAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Order(2)
                @Compile(on.property.withAnnotations(BProperty))
                compileB(ctxt: CompileContext<any, AdviceType.CLASS>) {
                    compileBAdvice(ctxt);
                }

                @Order(2)
                @Before(on.property.withAnnotations(BProperty))
                beforeB(ctxt: CompileContext<any, AdviceType.CLASS>) {
                    beforeBAdvice(ctxt);
                }
            }
            propertyAspectA = PropertyAspectA;
            propertyAspectB = PropertyAspectB;
            weaver.enable(new PropertyAspectA(), new PropertyAspectB());
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

                compileAAdvice.and.callFake((ctxt) => pushData(ctxt, 'compileA'));
                compileBAdvice.and.callFake((ctxt) => pushData(ctxt, 'compileB'));

                beforeAAdvice.and.callFake((ctxt) => pushData(ctxt, 'beforeA'));
                beforeBAdvice.and.callFake((ctxt) => pushData(ctxt, 'beforeB'));
            });
            it('should be shared across two @Compile advices on the same property', () => {
                class Test {
                    @AProperty()
                    @BProperty()
                    prop: any;
                }

                expect(data.advices).toEqual(['compileA', 'compileB']);
            });

            it('should not be shared across two @Compile advices on different properties', () => {
                @AClass()
                class Test {
                    @AProperty()
                    prop1: any;

                    @BProperty()
                    prop2: any;
                }

                expect(data.advices).toEqual(['compileB']);
            });

            it('should be shared between a @Compile and a @Before advice on the same property', () => {
                class Test {
                    @AProperty()
                    @BProperty()
                    prop: any;
                }
                expect(data.advices).toEqual(['compileA', 'compileB']);
                new Test().prop;
                expect(data.advices).toEqual(['compileA', 'compileB', 'beforeA', 'beforeB']);
            });
        });

        describe('attribute "ctxt.advice"', () => {
            it('should be the current compile advice', () => {
                compileAAdvice.and.callFake((ctxt: CompileContext) => {
                    expect(ctxt.advice.aspect.constructor).toEqual(propertyAspectA);
                });
                compileBAdvice.and.callFake((ctxt: CompileContext) => {
                    expect(ctxt.advice.aspect.constructor).toEqual(propertyAspectB);
                });

                class Test {
                    @AProperty()
                    @BProperty()
                    prop: any;
                }
                expect(compileAAdvice).toHaveBeenCalled();
                expect(compileBAdvice).toHaveBeenCalled();
            });
        });
    });
    describe('on a method', () => {
        let methodAspectA: any;
        let methodAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @Order(1)
                @Compile(on.method.withAnnotations(AMethod))
                compileA(ctxt: CompileContext<any, AdviceType.METHOD>) {
                    compileAAdvice(ctxt);
                }

                @Order(1)
                @Before(on.method.withAnnotations(AMethod))
                beforeA(ctxt: CompileContext<any, AdviceType.METHOD>) {
                    beforeAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Order(2)
                @Compile(on.method.withAnnotations(BMethod))
                compileB(ctxt: CompileContext<any, AdviceType.METHOD>) {
                    compileBAdvice(ctxt);
                }

                @Order(2)
                @Before(on.method.withAnnotations(BMethod))
                beforeB(ctxt: CompileContext<any, AdviceType.METHOD>) {
                    beforeBAdvice(ctxt);
                }
            }
            methodAspectA = PropertyAspectA;
            methodAspectB = PropertyAspectB;
            weaver.enable(new PropertyAspectA(), new PropertyAspectB());
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

                compileAAdvice.and.callFake((ctxt) => pushData(ctxt, 'compileA'));
                compileBAdvice.and.callFake((ctxt) => pushData(ctxt, 'compileB'));

                beforeAAdvice.and.callFake((ctxt) => pushData(ctxt, 'beforeA'));
                beforeBAdvice.and.callFake((ctxt) => pushData(ctxt, 'beforeB'));
            });
            it('should be shared across two @Compile advices on the same method', () => {
                class Test {
                    @AMethod()
                    @BMethod()
                    someMethod(): any {}
                }

                expect(data.advices).toEqual(['compileA', 'compileB']);
            });

            it('should not be shared across two @Compile advices on different method', () => {
                @AClass()
                class Test {
                    @AMethod()
                    method1(): any {}

                    @BMethod()
                    method2(): any {}
                }

                expect(data.advices).toEqual(['compileB']);
            });

            it('should be shared between a @Compile and a @Before advice on the same method', () => {
                class Test {
                    @AMethod()
                    @BMethod()
                    method(): any {}
                }
                expect(data.advices).toEqual(['compileA', 'compileB']);
                new Test().method();
                expect(data.advices).toEqual(['compileA', 'compileB', 'beforeA', 'beforeB']);
            });
        });
        describe('attribute "ctxt.advice"', () => {
            it('should be the current compile advice', () => {
                compileAAdvice.and.callFake((ctxt: CompileContext) => {
                    expect(ctxt.advice.aspect.constructor).toEqual(methodAspectA);
                });
                compileBAdvice.and.callFake((ctxt: CompileContext) => {
                    expect(ctxt.advice.aspect.constructor).toEqual(methodAspectB);
                });

                class Test {
                    @AMethod()
                    @BMethod()
                    method(): any {}
                }
                expect(compileAAdvice).toHaveBeenCalled();
                expect(compileBAdvice).toHaveBeenCalled();
            });
        });
    });
    describe('on a parameter', () => {
        let parameterAspectA: any;
        let parameterAspectB: any;
        beforeEach(() => {
            @Aspect()
            class ParameterAspectA {
                @Order(1)
                @Compile(on.parameter.withAnnotations(AParameter))
                compileA(ctxt: CompileContext<any, AdviceType.PARAMETER>) {
                    compileAAdvice(ctxt);
                }

                @Order(1)
                @Before(on.parameter.withAnnotations(AParameter))
                beforeA(ctxt: CompileContext<any, AdviceType.PARAMETER>) {
                    beforeAAdvice(ctxt);
                }
            }
            @Aspect()
            class ParameterAspectB {
                @Order(2)
                @Compile(on.parameter.withAnnotations(BParameter))
                compileB(ctxt: CompileContext<any, AdviceType.PARAMETER>) {
                    compileBAdvice(ctxt);
                }

                @Order(2)
                @Before(on.parameter.withAnnotations(BParameter))
                beforeB(ctxt: CompileContext<any, AdviceType.PARAMETER>) {
                    beforeBAdvice(ctxt);
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

                compileAAdvice.and.callFake((ctxt) => pushData(ctxt, 'compileA'));
                compileBAdvice.and.callFake((ctxt) => pushData(ctxt, 'compileB'));

                beforeAAdvice.and.callFake((ctxt) => pushData(ctxt, 'beforeA'));
                beforeBAdvice.and.callFake((ctxt) => pushData(ctxt, 'beforeB'));
            });
            it('should be shared across two @Compile advices on the same parameter', () => {
                class Test {
                    someMethod(@AParameter() @BParameter() param: any): any {}
                }

                expect(data.advices).toEqual(['compileA', 'compileB']);
            });

            it('should not be shared across two @Compile advices on different parameters', () => {
                class Test {
                    method(@AParameter() paramA: any, @BParameter() paramB: any): any {}
                }

                expect(data.advices).toEqual(['compileA']);
            });

            it('should be shared between a @Compile and a @Before advice on the same parameters', () => {
                class Test {
                    someMethod(@AParameter() @BParameter() param: any): any {}
                }
                expect(data.advices).toEqual(['compileA', 'compileB']);
                new Test().someMethod('');
                expect(data.advices).toEqual(['compileA', 'compileB', 'beforeA', 'beforeB']);
            });
        });

        describe('attribute "ctxt.advice"', () => {
            it('should be the current compile advice', () => {
                compileAAdvice.and.callFake((ctxt: CompileContext) => {
                    expect(ctxt.advice.aspect.constructor).toEqual(parameterAspectA);
                });
                compileBAdvice.and.callFake((ctxt: CompileContext) => {
                    expect(ctxt.advice.aspect.constructor).toEqual(parameterAspectB);
                });

                class Test {
                    someMethod(@AParameter() @BParameter() param: any): any {}
                }
                expect(compileAAdvice).toHaveBeenCalled();
                expect(compileBAdvice).toHaveBeenCalled();
            });
        });
    });
});
