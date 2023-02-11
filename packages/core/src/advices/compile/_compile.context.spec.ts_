import { Aspect, Before, Compile, Order } from '@aspectjs/core/annotations';
import { _AClass, _AMethod, _AParameter, _AProperty, _BClass, _BMethod, _BParameter, _BProperty } from '@root/testing';

import { setupAspectTestingContext } from '@aspectjs/core/testing';
import { CompileContext } from './compile.context';
import { Weaver } from '@aspectjs/weaver';
import { AdviceContext, AdviceType, on } from '../../..';

describe('CompileContext', () => {
    let weaver: Weaver;
    let compileAAdvice = jasmine.createSpy('compileAAdvice');
    let compileBAdvice = jasmine.createSpy('compileBAdvice');
    let beforeAAdvice = jasmine.createSpy('beforeAAdvice');
    let beforeBAdvice = jasmine.createSpy('beforeBAdvice');

    beforeEach(() => {
        weaver = setupAspectTestingContext().weaverContext.getWeaver();
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
                @Compile(on.class.withAnnotations(_AClass))
                compileA(ctxt: CompileContext<any, AdviceType.PROPERTY>) {
                    compileAAdvice(ctxt);
                }

                @Order(1)
                @Before(on.class.withAnnotations(_AClass))
                beforeA(ctxt: CompileContext<any, AdviceType.PROPERTY>) {
                    beforeAAdvice(ctxt);
                }
            }
            @Aspect()
            class ClassAspectB {
                @Order(2)
                @Compile(on.class.withAnnotations(_BClass))
                compileB(ctxt: CompileContext<any, AdviceType.PROPERTY>) {
                    compileBAdvice(ctxt);
                }

                @Order(2)
                @Before(on.class.withAnnotations(_BClass))
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
                @_AClass()
                @_BClass()
                class Test {}

                expect(data.advices).toEqual(['compileA', 'compileB']);
            });

            it('should not be shared across two @Compile advices on different classes', () => {
                @_AClass()
                class Test1 {}

                expect(data.advices).toEqual(['compileA']);
                @_BClass()
                class Test2 {}

                expect(data.advices).toEqual(['compileB']);
            });

            it('should be shared between a @Compile and a @Before advice on the same class', () => {
                @_AClass()
                @_BClass()
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

                @_AClass()
                @_BClass()
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
                @Compile(on.property.withAnnotations(_AProperty))
                compileA(ctxt: CompileContext<any, AdviceType.CLASS>) {
                    compileAAdvice(ctxt);
                }

                @Order(1)
                @Before(on.property.withAnnotations(_AProperty))
                beforeA(ctxt: CompileContext<any, AdviceType.CLASS>) {
                    beforeAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Order(2)
                @Compile(on.property.withAnnotations(_BProperty))
                compileB(ctxt: CompileContext<any, AdviceType.CLASS>) {
                    compileBAdvice(ctxt);
                }

                @Order(2)
                @Before(on.property.withAnnotations(_BProperty))
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
                    @_AProperty()
                    @_BProperty()
                    prop: any;
                }

                expect(data.advices).toEqual(['compileA', 'compileB']);
            });

            it('should not be shared across two @Compile advices on different properties', () => {
                @_AClass()
                class Test {
                    @_AProperty()
                    prop1: any;

                    @_BProperty()
                    prop2: any;
                }

                expect(data.advices).toEqual(['compileB']);
            });

            it('should be shared between a @Compile and a @Before advice on the same property', () => {
                class Test {
                    @_AProperty()
                    @_BProperty()
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
                    @_AProperty()
                    @_BProperty()
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
                @Compile(on.method.withAnnotations(_AMethod))
                compileA(ctxt: CompileContext<any, AdviceType.METHOD>) {
                    compileAAdvice(ctxt);
                }

                @Order(1)
                @Before(on.method.withAnnotations(_AMethod))
                beforeA(ctxt: CompileContext<any, AdviceType.METHOD>) {
                    beforeAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Order(2)
                @Compile(on.method.withAnnotations(_BMethod))
                compileB(ctxt: CompileContext<any, AdviceType.METHOD>) {
                    compileBAdvice(ctxt);
                }

                @Order(2)
                @Before(on.method.withAnnotations(_BMethod))
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
                    @_AMethod()
                    @_BMethod()
                    someMethod(): any {}
                }

                expect(data.advices).toEqual(['compileA', 'compileB']);
            });

            it('should not be shared across two @Compile advices on different method', () => {
                @_AClass()
                class Test {
                    @_AMethod()
                    method1(): any {}

                    @_BMethod()
                    method2(): any {}
                }

                expect(data.advices).toEqual(['compileB']);
            });

            it('should be shared between a @Compile and a @Before advice on the same method', () => {
                class Test {
                    @_AMethod()
                    @_BMethod()
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
                    @_AMethod()
                    @_BMethod()
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
                @Compile(on.parameter.withAnnotations(_AParameter))
                compileA(ctxt: CompileContext<any, AdviceType.PARAMETER>) {
                    compileAAdvice(ctxt);
                }

                @Order(1)
                @Before(on.parameter.withAnnotations(_AParameter))
                beforeA(ctxt: CompileContext<any, AdviceType.PARAMETER>) {
                    beforeAAdvice(ctxt);
                }
            }
            @Aspect()
            class ParameterAspectB {
                @Order(2)
                @Compile(on.parameter.withAnnotations(_BParameter))
                compileB(ctxt: CompileContext<any, AdviceType.PARAMETER>) {
                    compileBAdvice(ctxt);
                }

                @Order(2)
                @Before(on.parameter.withAnnotations(_BParameter))
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
                    someMethod(@_AParameter() @_BParameter() param: any): any {}
                }

                expect(data.advices).toEqual(['compileA', 'compileB']);
            });

            it('should not be shared across two @Compile advices on different parameters', () => {
                class Test {
                    method(@_AParameter() paramA: any, @_BParameter() paramB: any): any {}
                }

                expect(data.advices).toEqual(['compileA']);
            });

            it('should be shared between a @Compile and a @Before advice on the same parameters', () => {
                class Test {
                    someMethod(@_AParameter() @_BParameter() param: any): any {}
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
                    someMethod(@_AParameter() @_BParameter() param: any): any {}
                }
                expect(compileAAdvice).toHaveBeenCalled();
                expect(compileBAdvice).toHaveBeenCalled();
            });
        });
    });
});
