import { AdviceContext, AroundContext, BeforeContext, CompileContext } from '../advice-context';
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
} from '../../../../tests/helpers';
import { AnnotationType } from '../../../annotation/annotation.types';
import { setWeaver, Weaver } from '../../weaver';
import { LoadTimeWeaver } from '../../load-time/load-time-weaver';
import { Around } from '../around/around.decorator';
import { Before } from './before.decorator';

describe('BeforeContext', () => {
    let weaver: Weaver;
    let beforeAAdvice = jasmine.createSpy('beforeAAdvice');
    let beforeBAdvice = jasmine.createSpy('beforeBAdvice');
    let aroundAAdvice = jasmine.createSpy('aroundAAdvice');
    let aroundBAdvice = jasmine.createSpy('aroundBAdvice');

    beforeEach(() => {
        setWeaver((weaver = new LoadTimeWeaver()));
        beforeAAdvice = jasmine.createSpy('beforeAAdvice');
        beforeBAdvice = jasmine.createSpy('beforeBAdvice');
        aroundAAdvice = jasmine.createSpy('aroundAAdvice');
        aroundBAdvice = jasmine.createSpy('aroundBAdvice');
    });

    describe('on a class', () => {
        let classAspectB: any;
        beforeEach(() => {
            @Aspect()
            class ClassAspectA {
                @Before(on.class.withAnnotations(AClass), { priority: 10 })
                beforeA(ctxt: BeforeContext<any, AnnotationType.PROPERTY>): void {
                    beforeAAdvice(ctxt);
                }

                @Around(on.class.withAnnotations(AClass), { priority: 10 })
                aroundA(ctxt: AroundContext<any, AnnotationType.PROPERTY>): void {
                    aroundAAdvice(ctxt);
                }
            }
            @Aspect()
            class ClassAspectB {
                @Before(on.class.withAnnotations(BClass), { priority: 9 })
                beforeB(ctxt: BeforeContext<any, AnnotationType.PROPERTY>): void {
                    beforeBAdvice(ctxt);
                }

                @Around(on.class.withAnnotations(BClass), { priority: 9 })
                aroundB(ctxt: AroundContext<any, AnnotationType.PROPERTY>): void {
                    aroundBAdvice(ctxt);
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

                beforeAAdvice.and.callFake(ctxt => pushData(ctxt, 'beforeA'));
                beforeBAdvice.and.callFake(ctxt => pushData(ctxt, 'beforeB'));
            });
            it('should be shared across two @Before advices on the same class', () => {
                @AClass()
                @BClass()
                class Test {}
                new Test();

                expect(data.advices).toEqual(['beforeA', 'beforeB']);
            });

            it('should not shared across two @Before advices on different classes', () => {
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
                aroundAAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                    pushData(ctxt, 'aroundA');
                    return ctxt.joinpoint();
                });
                aroundBAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                    pushData(ctxt, 'aroundB');
                    return ctxt.joinpoint();
                });

                @AClass()
                @BClass()
                class Test {}
                new Test();
                expect(data.advices).toEqual(['beforeA', 'beforeB', 'aroundA', 'aroundB']);
            });
        });
        describe('attribute "ctxt.advices"', () => {
            it('should exist', () => {
                beforeAAdvice.and.callFake((ctxt: AdviceContext<any, any>) => {
                    expect(ctxt.advices).toBeDefined();
                    expect(ctxt.advices).toEqual(jasmine.any(Array));
                });

                @AClass()
                class Test {}

                expect(beforeAAdvice).not.toHaveBeenCalled();
                new Test();
                expect(beforeAAdvice).toHaveBeenCalled();
            });

            describe('when there is only one advice executed', () => {
                it('should be empty', () => {
                    beforeAAdvice.and.callFake((ctxt: AdviceContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });

                    @AClass()
                    class Test {}

                    expect(beforeAAdvice).not.toHaveBeenCalled();
                    new Test();
                    expect(beforeAAdvice).toHaveBeenCalled();
                });
            });

            describe('when there is more than one advice configured', () => {
                it('should hold the next ongoing advice', () => {
                    beforeAAdvice.and.callFake((ctxt: AdviceContext<any, any>) => {
                        expect(ctxt.advices.length).toEqual(1);
                        expect(ctxt.advices[0].aspect.constructor).toEqual(classAspectB);
                    });

                    beforeBAdvice.and.callFake((ctxt: AdviceContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });

                    @AClass()
                    @BClass()
                    class Test {}
                    [beforeAAdvice, beforeBAdvice].forEach(f => expect(f).not.toHaveBeenCalled());
                    new Test();
                    [beforeAAdvice, beforeBAdvice].forEach(f => expect(f).toHaveBeenCalled());
                });
            });

            describe('deleting advices from ctxt.advices', () => {
                it('should prevent the corresponding ongoing advise execution', () => {
                    beforeAAdvice.and.callFake((ctxt: AdviceContext<any, any>) => {
                        ctxt.advices = [];
                    });

                    @BClass()
                    @AClass()
                    class Test {}
                    [beforeAAdvice, beforeBAdvice].forEach(f => expect(f).not.toHaveBeenCalled());
                    new Test();
                    expect(beforeAAdvice).toHaveBeenCalled();
                });
            });
        });
    });
    describe('on a property', () => {
        let propertyAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @Before(on.property.withAnnotations(AProperty), { priority: 10 })
                beforeA(ctxt: BeforeContext<any, AnnotationType.CLASS>): void {
                    beforeAAdvice(ctxt);
                }

                @Around(on.property.withAnnotations(AProperty), { priority: 10 })
                aroundA(ctxt: CompileContext<any, AnnotationType.CLASS>): void {
                    aroundAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Before(on.property.withAnnotations(BProperty), { priority: 9 })
                beforeB(ctxt: BeforeContext<any, AnnotationType.CLASS>): void {
                    beforeBAdvice(ctxt);
                }

                @Around(on.property.withAnnotations(BProperty), { priority: 9 })
                aroundB(ctxt: CompileContext<any, AnnotationType.CLASS>): void {
                    aroundBAdvice(ctxt);
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

                beforeAAdvice.and.callFake(ctxt => pushData(ctxt, 'beforeA'));
                beforeBAdvice.and.callFake(ctxt => pushData(ctxt, 'beforeB'));
            });
            it('should be shared across two @Before advices on the same property', () => {
                class Test {
                    @AProperty()
                    @BProperty()
                    prop: any;
                }

                [beforeAAdvice, beforeBAdvice].forEach(f => expect(f).not.toHaveBeenCalled());
                new Test().prop;
                [beforeAAdvice, beforeBAdvice].forEach(f => expect(f).toHaveBeenCalled());
                expect(data.advices).toEqual(['beforeA', 'beforeB']);
            });

            it('should not shared across two @Before advices on different properties', () => {
                @AClass()
                class Test {
                    @AProperty()
                    prop1: any;

                    @BProperty()
                    prop2: any;
                }
                const t = new Test();

                [beforeAAdvice, beforeBAdvice].forEach(f => expect(f).not.toHaveBeenCalled());
                t.prop1;
                t.prop2;
                [beforeAAdvice, beforeBAdvice].forEach(f => expect(f).toHaveBeenCalled());

                expect(data.advices).toEqual(['beforeB']);
            });

            it('should be shared between a @Before and a @Around advice on the same property', () => {
                aroundAAdvice.and.callFake(ctxt => {
                    pushData(ctxt, 'aroundA');
                    return ctxt.joinpoint();
                });
                aroundBAdvice.and.callFake(ctxt => {
                    pushData(ctxt, 'aroundB');
                    return ctxt.joinpoint();
                });

                class Test {
                    @AProperty()
                    @BProperty()
                    prop: any;
                }

                [beforeAAdvice, beforeBAdvice, aroundAAdvice, aroundBAdvice].forEach(f =>
                    expect(f).not.toHaveBeenCalled(),
                );
                new Test().prop;
                [beforeAAdvice, beforeBAdvice, aroundAAdvice, aroundBAdvice].forEach(f => expect(f).toHaveBeenCalled());
                expect(data.advices).toEqual(['beforeA', 'beforeB', 'aroundA', 'aroundB']);
            });
        });
        describe('attribute "ctxt.advices"', () => {
            it('should exist', () => {
                beforeAAdvice.and.callFake((ctxt: AdviceContext<any, any>) => {
                    expect(ctxt.advices).toBeDefined();
                    expect(ctxt.advices).toEqual(jasmine.any(Array));
                });

                class Test {
                    @AProperty()
                    prop: any;
                }

                expect(beforeAAdvice).not.toHaveBeenCalled();
                new Test().prop;
                expect(beforeAAdvice).toHaveBeenCalled();
            });

            describe('when there is only one advice executed', () => {
                it('should be empty', () => {
                    beforeAAdvice.and.callFake((ctxt: AdviceContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });

                    class Test {
                        @AProperty()
                        prop: any;
                    }

                    expect(beforeAAdvice).not.toHaveBeenCalled();
                    new Test().prop;
                    expect(beforeAAdvice).toHaveBeenCalled();
                });
            });

            describe('when there is more than one advice configured', () => {
                it('should hold the next ongoing advice', () => {
                    beforeAAdvice.and.callFake((ctxt: AdviceContext<any, any>) => {
                        expect(ctxt.advices.length).toEqual(1);
                        expect(ctxt.advices[0].aspect.constructor).toEqual(propertyAspectB);
                    });

                    beforeBAdvice.and.callFake((ctxt: AdviceContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });

                    class Test {
                        @AProperty()
                        @BProperty()
                        prop: any;
                    }
                    [beforeAAdvice, beforeBAdvice].forEach(fn => expect(fn).not.toHaveBeenCalled());
                    new Test().prop;
                    [beforeAAdvice, beforeBAdvice].forEach(fn => expect(fn).toHaveBeenCalled());
                });
            });

            describe('deleting advices from ctxt.advices', () => {
                it('should prevent the corresponding ongoing advise execution', () => {
                    beforeAAdvice.and.callFake((ctxt: AdviceContext<any, any>) => {
                        ctxt.advices = [];
                    });

                    class Test {
                        @BProperty()
                        @AProperty()
                        prop: any;
                    }
                    [beforeAAdvice, beforeBAdvice].forEach(fn => expect(fn).not.toHaveBeenCalled());
                    new Test().prop;
                    [beforeAAdvice].forEach(fn => expect(fn).toHaveBeenCalled());
                });
            });
        });
    });
    describe('on a property setter', () => {
        let propertyAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @Before(on.property.setter.withAnnotations(AProperty), { priority: 10 })
                beforeA(ctxt: BeforeContext<any, AnnotationType.CLASS>): void {
                    beforeAAdvice(ctxt);
                }

                @Around(on.property.setter.withAnnotations(AProperty), { priority: 10 })
                aroundA(ctxt: CompileContext<any, AnnotationType.CLASS>): void {
                    aroundAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Before(on.property.setter.withAnnotations(BProperty), { priority: 9 })
                beforeB(ctxt: BeforeContext<any, AnnotationType.CLASS>): void {
                    beforeBAdvice(ctxt);
                }

                @Around(on.property.setter.withAnnotations(BProperty), { priority: 9 })
                aroundB(ctxt: CompileContext<any, AnnotationType.CLASS>): void {
                    aroundBAdvice(ctxt);
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

                beforeAAdvice.and.callFake(ctxt => pushData(ctxt, 'beforeA'));
                beforeBAdvice.and.callFake(ctxt => pushData(ctxt, 'beforeB'));
            });
            it('should be shared across two @Before advices on the same property', () => {
                class Test {
                    @AProperty()
                    @BProperty()
                    prop: any;
                }
                [beforeAAdvice, beforeBAdvice].forEach(fn => expect(fn).not.toHaveBeenCalled());
                new Test().prop = 'toto';
                [beforeAAdvice, beforeBAdvice].forEach(fn => expect(fn).toHaveBeenCalled());
                expect(data.advices).toEqual(['beforeA', 'beforeB']);
            });

            it('should not shared across two @Before advices on different properties', () => {
                @AClass()
                class Test {
                    @AProperty()
                    prop1: any;

                    @BProperty()
                    prop2: any;
                }

                [beforeAAdvice, beforeBAdvice].forEach(fn => expect(fn).not.toHaveBeenCalled());
                const t = new Test();
                t.prop1 = 'toto';
                t.prop2 = 'toto';
                [beforeAAdvice, beforeBAdvice].forEach(fn => expect(fn).toHaveBeenCalled());

                expect(data.advices).toEqual(['beforeB']);
            });

            it('should be shared between a @Before and a @Around advice on the same property', () => {
                aroundAAdvice.and.callFake(ctxt => {
                    pushData(ctxt, 'aroundA');
                    return ctxt.joinpoint();
                });
                aroundBAdvice.and.callFake(ctxt => {
                    pushData(ctxt, 'aroundB');
                    return ctxt.joinpoint();
                });

                class Test {
                    @AProperty()
                    @BProperty()
                    prop: any;
                }
                [beforeAAdvice, beforeBAdvice, aroundAAdvice, aroundBAdvice].forEach(fn =>
                    expect(fn).not.toHaveBeenCalled(),
                );
                new Test().prop = '';
                [beforeAAdvice, beforeBAdvice, aroundAAdvice, aroundBAdvice].forEach(fn =>
                    expect(fn).toHaveBeenCalled(),
                );
                expect(data.advices).toEqual(['beforeA', 'beforeB', 'aroundA', 'aroundB']);
            });
        });
        describe('attribute "ctxt.advices"', () => {
            it('should exist', () => {
                beforeAAdvice.and.callFake((ctxt: AdviceContext<any, any>) => {
                    expect(ctxt.advices).toBeDefined();
                    expect(ctxt.advices).toEqual(jasmine.any(Array));
                });

                class Test {
                    @AProperty()
                    prop: any;
                }

                new Test().prop = '';
                expect(beforeAAdvice).toHaveBeenCalled();
            });

            describe('when there is only one advice executed', () => {
                it('should be empty', () => {
                    beforeAAdvice.and.callFake((ctxt: AdviceContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });

                    class Test {
                        @AProperty()
                        prop: any;
                    }
                    new Test().prop = '';

                    expect(beforeAAdvice).toHaveBeenCalled();
                });
            });

            describe('when there is more than one advice configured', () => {
                it('should hold the next ongoing advice', () => {
                    beforeAAdvice.and.callFake((ctxt: AdviceContext<any, any>) => {
                        expect(ctxt.advices.length).toEqual(1);
                        expect(ctxt.advices[0].aspect.constructor).toEqual(propertyAspectB);
                    });

                    beforeBAdvice.and.callFake((ctxt: AdviceContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });

                    class Test {
                        @AProperty()
                        @BProperty()
                        prop: any;
                    }
                    new Test().prop = '';

                    expect(beforeAAdvice).toHaveBeenCalled();
                    expect(beforeBAdvice).toHaveBeenCalled();
                });
            });

            describe('deleting advices from ctxt.advices', () => {
                it('should prevent the corresponding ongoing advise execution', () => {
                    beforeAAdvice.and.callFake((ctxt: AdviceContext<any, any>) => {
                        ctxt.advices = [];
                    });

                    class Test {
                        @BProperty()
                        @AProperty()
                        prop: any;
                    }
                    new Test().prop = '';

                    expect(beforeAAdvice).toHaveBeenCalled();
                    expect(beforeBAdvice).not.toHaveBeenCalled();
                });
            });
        });
    });
    describe('on a method', () => {
        let methodAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @Before(on.method.withAnnotations(AMethod), { priority: 10 })
                beforeA(ctxt: BeforeContext<any, AnnotationType.METHOD>): void {
                    beforeAAdvice(ctxt);
                }

                @Around(on.method.withAnnotations(AMethod), { priority: 10 })
                aroundA(ctxt: CompileContext<any, AnnotationType.METHOD>): void {
                    aroundAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @Before(on.method.withAnnotations(BMethod), { priority: 9 })
                beforeB(ctxt: BeforeContext<any, AnnotationType.METHOD>): void {
                    beforeBAdvice(ctxt);
                }

                @Around(on.method.withAnnotations(BMethod), { priority: 9 })
                aroundB(ctxt: CompileContext<any, AnnotationType.METHOD>): void {
                    aroundBAdvice(ctxt);
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

                beforeAAdvice.and.callFake(ctxt => pushData(ctxt, 'beforeA'));
                beforeBAdvice.and.callFake(ctxt => pushData(ctxt, 'beforeB'));
            });

            it('should be shared across two @Before advices on the same method', () => {
                class Test {
                    @AMethod()
                    @BMethod()
                    someMethod(): any {}
                }
                [beforeAAdvice, beforeBAdvice].forEach(fn => expect(fn).not.toHaveBeenCalled());
                new Test().someMethod();
                [beforeAAdvice, beforeBAdvice].forEach(fn => expect(fn).toHaveBeenCalled());

                expect(data.advices).toEqual(['beforeA', 'beforeB']);
            });

            it('should not shared across two @Before advices on different method', () => {
                @AClass()
                class Test {
                    @AMethod()
                    method1(): any {}

                    @BMethod()
                    method2(): any {}
                }

                [beforeAAdvice, beforeBAdvice].forEach(fn => expect(fn).not.toHaveBeenCalled());
                const t = new Test();
                t.method1();
                t.method2();
                [beforeAAdvice, beforeBAdvice].forEach(fn => expect(fn).toHaveBeenCalled());

                expect(data.advices).toEqual(['beforeB']);
            });

            it('should be shared between a @Before and a @Around advice on the same method', () => {
                aroundAAdvice.and.callFake(ctxt => {
                    pushData(ctxt, 'aroundA');
                    return ctxt.joinpoint();
                });
                aroundBAdvice.and.callFake(ctxt => {
                    pushData(ctxt, 'aroundB');
                    return ctxt.joinpoint();
                });

                class Test {
                    @AMethod()
                    @BMethod()
                    method(): any {}
                }

                new Test().method();
                expect(data.advices).toEqual(['beforeA', 'beforeB', 'aroundA', 'aroundB']);
            });
        });
        describe('attribute "ctxt.advices"', () => {
            it('should exist', () => {
                beforeAAdvice.and.callFake((ctxt: AdviceContext<any, any>) => {
                    expect(ctxt.advices).toBeDefined();
                    expect(ctxt.advices).toEqual(jasmine.any(Array));
                });

                class Test {
                    @AMethod()
                    method(): any {}
                }

                expect(beforeAAdvice).not.toHaveBeenCalled();
                new Test().method();
                expect(beforeAAdvice).toHaveBeenCalled();
            });

            describe('when there is only one advice executed', () => {
                it('should be empty', () => {
                    beforeAAdvice.and.callFake((ctxt: AdviceContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });

                    class Test {
                        @AMethod()
                        method(): any {}
                    }
                    expect(beforeAAdvice).not.toHaveBeenCalled();
                    new Test().method();
                    expect(beforeAAdvice).toHaveBeenCalled();
                });
            });

            describe('when there is more than one advice configured', () => {
                it('should hold the next ongoing advice', () => {
                    beforeAAdvice.and.callFake((ctxt: AdviceContext<any, any>) => {
                        expect(ctxt.advices.length).toEqual(1);
                        expect(ctxt.advices[0].aspect.constructor).toEqual(methodAspectB);
                    });

                    beforeBAdvice.and.callFake((ctxt: AdviceContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });

                    class Test {
                        @AMethod()
                        @BMethod()
                        method(): any {}
                    }

                    [beforeAAdvice, beforeBAdvice].forEach(fn => expect(fn).not.toHaveBeenCalled());
                    new Test().method();
                    [beforeAAdvice, beforeBAdvice].forEach(fn => expect(fn).toHaveBeenCalled());
                });
            });

            describe('deleting advices from ctxt.advices', () => {
                it('should prevent the corresponding ongoing advise execution', () => {
                    beforeAAdvice.and.callFake((ctxt: AdviceContext<any, any>) => {
                        ctxt.advices = [];
                    });

                    class Test {
                        @BMethod()
                        @AMethod()
                        method(): any {}
                    }

                    new Test().method();
                    expect(beforeAAdvice).toHaveBeenCalled();
                    expect(beforeBAdvice).not.toHaveBeenCalled();
                });
            });
        });
    });
    xdescribe('on a parameter', () => {
        let parameterAspectB: any;
        beforeEach(() => {
            @Aspect()
            class ParameterAspectA {
                @Before(on.parameter.withAnnotations(AParameter), { priority: 10 })
                beforeA(ctxt: BeforeContext<any, AnnotationType.PARAMETER>): void {
                    beforeAAdvice(ctxt);
                }

                @Around(on.parameter.withAnnotations(AParameter), { priority: 10 })
                aroundA(ctxt: CompileContext<any, AnnotationType.PARAMETER>): void {
                    aroundAAdvice(ctxt);
                }
            }
            @Aspect()
            class ParameterAspectB {
                @Before(on.parameter.withAnnotations(BParameter), { priority: 9 })
                beforeB(ctxt: BeforeContext<any, AnnotationType.PARAMETER>): void {
                    beforeBAdvice(ctxt);
                }

                @Around(on.parameter.withAnnotations(BParameter), { priority: 9 })
                aroundB(ctxt: CompileContext<any, AnnotationType.PARAMETER>): void {
                    aroundBAdvice(ctxt);
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

                beforeAAdvice.and.callFake(ctxt => pushData(ctxt, 'beforeA'));
                beforeBAdvice.and.callFake(ctxt => pushData(ctxt, 'beforeB'));
            });
            it('should be shared across two @Before advices on the same parameter', () => {
                class Test {
                    someMethod(@AParameter() @BParameter() param: any): any {}
                }

                new Test().someMethod('');

                expect(data.advices).toEqual(['beforeA', 'beforeB']);
            });

            it('should not shared across two @Before advices on different parameters', () => {
                class Test {
                    someMethod(@AParameter() paramA: any, @BParameter() paramB: any): any {}
                }
                new Test().someMethod('', '');

                expect(data.advices).toEqual(['beforeA']);
            });

            it('should be shared between a @Before and a @Around advice on the same parameters', () => {
                aroundAAdvice.and.callFake(ctxt => {
                    pushData(ctxt, 'aroundA');
                    ctxt.joinpoint();
                });
                aroundBAdvice.and.callFake(ctxt => {
                    pushData(ctxt, 'aroundB');
                    ctxt.joinpoint();
                });

                class Test {
                    someMethod(@AParameter() @BParameter() param: any): any {}
                }

                new Test().someMethod('');
                expect(data.advices).toEqual(['beforeA', 'beforeB', 'aroundA', 'aroundB']);
            });
        });
        describe('attribute "ctxt.advices"', () => {
            it('should exist', () => {
                beforeAAdvice.and.callFake((ctxt: AdviceContext<any, any>) => {
                    expect(ctxt.advices).toBeDefined();
                    expect(ctxt.advices).toEqual(jasmine.any(Array));
                });

                class Test {
                    someMethod(@AParameter() param: any): any {}
                }

                expect(beforeAAdvice).not.toHaveBeenCalled();
                new Test().someMethod('');
                expect(beforeAAdvice).toHaveBeenCalled();
            });

            describe('when there is only one advice executed', () => {
                it('should be empty', () => {
                    beforeAAdvice.and.callFake((ctxt: AdviceContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });
                    class Test {
                        someMethod(@AParameter() param: any): any {}
                    }

                    expect(beforeAAdvice).not.toHaveBeenCalled();
                    new Test().someMethod('');
                    expect(beforeAAdvice).toHaveBeenCalled();
                });
            });

            describe('when there is more than one advice configured', () => {
                it('should hold the next ongoing advice', () => {
                    beforeAAdvice.and.callFake((ctxt: AdviceContext<any, any>) => {
                        expect(ctxt.advices.length).toEqual(1);
                        expect(ctxt.advices[0].aspect.constructor).toEqual(parameterAspectB);
                    });

                    beforeBAdvice.and.callFake((ctxt: AdviceContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });

                    class Test {
                        someMethod(@AParameter() @BParameter() param: any): any {}
                    }

                    [beforeAAdvice, beforeBAdvice].forEach(fn => expect(fn).not.toHaveBeenCalled());
                    new Test().someMethod('');
                    [beforeAAdvice, beforeBAdvice].forEach(fn => expect(fn).toHaveBeenCalled());
                });
            });

            describe('deleting advices from ctxt.advices', () => {
                it('should prevent the corresponding ongoing advise execution', () => {
                    beforeAAdvice.and.callFake((ctxt: AdviceContext<any, any>) => {
                        ctxt.advices = [];
                    });
                    class Test {
                        someMethod(@BParameter() @AParameter() param: any): any {}
                    }
                    expect(beforeAAdvice).not.toHaveBeenCalled();
                    new Test().someMethod('');
                    expect(beforeAAdvice).toHaveBeenCalled();
                });
            });
        });
    });
});
