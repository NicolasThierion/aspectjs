import { AdviceContext, CompileContext } from '../advice-context';
import { Aspect } from '../aspect';
import { Compile } from './compile.annotation';
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
import { WEAVER_CONTEXT } from '../../weaver/weaver-context';
import { Weaver } from '../../weaver/weaver';
import { JitWeaver } from '../../weaver/jit/jit-weaver';
import { AdviceType } from '../types';
import { Before } from '../before/before.annotation';

describe('CompileContext', () => {
    let weaver: Weaver;
    let compileAAdvice = jasmine.createSpy('compileAAdvice');
    let compileBAdvice = jasmine.createSpy('compileBAdvice');
    let beforeAAdvice = jasmine.createSpy('beforeAAdvice');
    let beforeBAdvice = jasmine.createSpy('beforeBAdvice');

    beforeEach(() => {
        WEAVER_CONTEXT.setWeaver((weaver = new JitWeaver()));
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
                @Compile(on.class.withAnnotations(AClass), { priority: 10 })
                compileA(ctxt: CompileContext<any, AdviceType.PROPERTY>) {
                    compileAAdvice(ctxt);
                }

                @Before(on.class.withAnnotations(AClass), { priority: 10 })
                beforeA(ctxt: CompileContext<any, AdviceType.PROPERTY>) {
                    beforeAAdvice(ctxt);
                }
            }
            @Aspect()
            class ClassAspectB {
                @Compile(on.class.withAnnotations(BClass), { priority: 9 })
                compileB(ctxt: CompileContext<any, AdviceType.PROPERTY>) {
                    compileBAdvice(ctxt);
                }

                @Before(on.class.withAnnotations(BClass), { priority: 9 })
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

            it('should not shared across two @Compile advices on different classes', () => {
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
    });
    describe('on a property', () => {
        let propertyAspectA: any;
        let propertyAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @Compile(on.property.withAnnotations(AProperty), { priority: 10 })
                compileA(ctxt: CompileContext<any, AdviceType.CLASS>) {
                    compileAAdvice(ctxt);
                }

                @Before(on.property.withAnnotations(AProperty), { priority: 10 })
                beforeA(ctxt: CompileContext<any, AdviceType.CLASS>) {
                    beforeAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Compile(on.property.withAnnotations(BProperty), { priority: 9 })
                compileB(ctxt: CompileContext<any, AdviceType.CLASS>) {
                    compileBAdvice(ctxt);
                }

                @Before(on.property.withAnnotations(BProperty), { priority: 9 })
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

            it('should not shared across two @Compile advices on different properties', () => {
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
    });
    describe('on a method', () => {
        let methodAspectA: any;
        let methodAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @Compile(on.method.withAnnotations(AMethod), { priority: 10 })
                compileA(ctxt: CompileContext<any, AdviceType.METHOD>) {
                    compileAAdvice(ctxt);
                }

                @Before(on.method.withAnnotations(AMethod), { priority: 10 })
                beforeA(ctxt: CompileContext<any, AdviceType.METHOD>) {
                    beforeAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Compile(on.method.withAnnotations(BMethod), { priority: 9 })
                compileB(ctxt: CompileContext<any, AdviceType.METHOD>) {
                    compileBAdvice(ctxt);
                }

                @Before(on.method.withAnnotations(BMethod), { priority: 9 })
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

            it('should not shared across two @Compile advices on different method', () => {
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
    });
    describe('on a parameter', () => {
        let parameterAspectA: any;
        let parameterAspectB: any;
        beforeEach(() => {
            @Aspect()
            class ParameterAspectA {
                @Compile(on.parameter.withAnnotations(AParameter), { priority: 10 })
                compileA(ctxt: CompileContext<any, AdviceType.PARAMETER>) {
                    compileAAdvice(ctxt);
                }

                @Before(on.parameter.withAnnotations(AParameter), { priority: 10 })
                beforeA(ctxt: CompileContext<any, AdviceType.PARAMETER>) {
                    beforeAAdvice(ctxt);
                }
            }
            @Aspect()
            class ParameterAspectB {
                @Compile(on.parameter.withAnnotations(BParameter), { priority: 9 })
                compileB(ctxt: CompileContext<any, AdviceType.PARAMETER>) {
                    compileBAdvice(ctxt);
                }

                @Before(on.parameter.withAnnotations(BParameter), { priority: 9 })
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

            it('should not shared across two @Compile advices on different parameters', () => {
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
    });
});
