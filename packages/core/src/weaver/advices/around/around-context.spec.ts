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
} from '../../../../tests/helpers';
import { AnnotationType } from '../../../annotation/annotation.types';
import { setWeaver, Weaver } from '../../weaver';
import { LoadTimeWeaver } from '../../load-time/load-time-weaver';
import { Around } from './around.decorator';
import { AfterReturn } from '../after-return/after-return.decorator';

describe('AroundContext', () => {
    let weaver: Weaver;
    let aroundAAdvice = jasmine.createSpy('aroundAAdvice');
    let aroundBAdvice = jasmine.createSpy('aroundBAdvice');
    let afterReturnAAdvice = jasmine.createSpy('afterReturnAAdvice');
    let afterReturnBAdvice = jasmine.createSpy('afterReturnBAdvice');

    beforeEach(() => {
        setWeaver((weaver = new LoadTimeWeaver()));
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
        describe('attribute "ctxt.advices"', () => {
            it('should exist', () => {
                aroundAAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                    expect(ctxt.advices).toBeDefined();
                    expect(ctxt.advices).toEqual(jasmine.any(Array));
                });

                @AClass()
                class Test {}

                expect(aroundAAdvice).not.toHaveBeenCalled();
                new Test();
                expect(aroundAAdvice).toHaveBeenCalled();
            });

            describe('when there is only one advice executed', () => {
                it('should be empty', () => {
                    aroundAAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });

                    @AClass()
                    class Test {}

                    expect(aroundAAdvice).not.toHaveBeenCalled();
                    new Test();
                    expect(aroundAAdvice).toHaveBeenCalled();
                });
            });

            describe('when there is more than one advice configured', () => {
                it('should hold the next ongoing advice', () => {
                    aroundAAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                        expect(ctxt.advices.length).toEqual(1);
                        expect(ctxt.advices[0].aspect.constructor).toEqual(classAspectB);
                        ctxt.joinpoint();
                    });

                    aroundBAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                        ctxt.joinpoint();
                    });

                    @AClass()
                    @BClass()
                    class Test {}
                    [aroundAAdvice, aroundBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
                    new Test();
                    [aroundAAdvice, aroundBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
                });
            });

            describe('deleting advices from ctxt.advices', () => {
                it('should prevent the corresponding ongoing advise execution', () => {
                    aroundAAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                        ctxt.advices = [];
                    });

                    @BClass()
                    @AClass()
                    class Test {}
                    [aroundAAdvice, aroundBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
                    new Test();
                    expect(aroundAAdvice).toHaveBeenCalled();
                });
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
        describe('attribute "ctxt.advices"', () => {
            it('should exist', () => {
                aroundAAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                    expect(ctxt.advices).toBeDefined();
                    expect(ctxt.advices).toEqual(jasmine.any(Array));
                });

                class Test {
                    @AProperty()
                    prop: any;
                }

                expect(aroundAAdvice).not.toHaveBeenCalled();
                new Test().prop;
                expect(aroundAAdvice).toHaveBeenCalled();
            });

            describe('when there is only one advice executed', () => {
                it('should be empty', () => {
                    aroundAAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });

                    class Test {
                        @AProperty()
                        prop: any;
                    }

                    expect(aroundAAdvice).not.toHaveBeenCalled();
                    new Test().prop;
                    expect(aroundAAdvice).toHaveBeenCalled();
                });
            });

            describe('when there is more than one advice configured', () => {
                it('should hold the next ongoing advice', () => {
                    aroundAAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                        expect(ctxt.advices.length).toEqual(1);
                        expect(ctxt.advices[0].aspect.constructor).toEqual(propertyAspectB);
                        return ctxt.joinpoint();
                    });

                    aroundBAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                        ctxt.joinpoint();
                    });

                    class Test {
                        @AProperty()
                        @BProperty()
                        prop: any;
                    }
                    [aroundAAdvice, aroundBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                    new Test().prop;
                    [aroundAAdvice, aroundBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());
                });
            });

            describe('deleting advices from ctxt.advices', () => {
                it('should prevent the corresponding ongoing advise execution', () => {
                    aroundAAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                        ctxt.advices = [];
                    });

                    class Test {
                        @BProperty()
                        @AProperty()
                        prop: any;
                    }
                    [aroundAAdvice, aroundBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                    new Test().prop;
                    [aroundAAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());
                });
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
        describe('attribute "ctxt.advices"', () => {
            it('should exist', () => {
                aroundAAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                    expect(ctxt.advices).toBeDefined();
                    expect(ctxt.advices).toEqual(jasmine.any(Array));
                    ctxt.joinpoint();
                });

                class Test {
                    @AProperty()
                    prop: any;
                }

                new Test().prop = '';
                expect(aroundAAdvice).toHaveBeenCalled();
            });

            describe('when there is only one advice executed', () => {
                it('should be empty', () => {
                    aroundAAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });

                    class Test {
                        @AProperty()
                        prop: any;
                    }
                    new Test().prop = '';

                    expect(aroundAAdvice).toHaveBeenCalled();
                });
            });

            describe('when there is more than one advice configured', () => {
                it('should hold the next ongoing advice', () => {
                    aroundAAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                        expect(ctxt.advices.length).toEqual(1);
                        expect(ctxt.advices[0].aspect.constructor).toEqual(propertyAspectB);
                        ctxt.joinpoint();
                    });

                    aroundBAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                        ctxt.joinpoint();
                    });

                    class Test {
                        @AProperty()
                        @BProperty()
                        prop: any;
                    }
                    new Test().prop = '';

                    expect(aroundAAdvice).toHaveBeenCalled();
                    expect(aroundBAdvice).toHaveBeenCalled();
                });
            });

            describe('deleting advices from ctxt.advices', () => {
                it('should prevent the corresponding ongoing advise execution', () => {
                    aroundAAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                        ctxt.advices = [];
                    });

                    class Test {
                        @BProperty()
                        @AProperty()
                        prop: any;
                    }
                    new Test().prop = '';

                    expect(aroundAAdvice).toHaveBeenCalled();
                    expect(aroundBAdvice).not.toHaveBeenCalled();
                });
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
        describe('attribute "ctxt.advices"', () => {
            it('should exist', () => {
                aroundAAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                    expect(ctxt.advices).toBeDefined();
                    expect(ctxt.advices).toEqual(jasmine.any(Array));
                    ctxt.joinpoint();
                });

                class Test {
                    @AMethod()
                    method(): any {}
                }

                expect(aroundAAdvice).not.toHaveBeenCalled();
                new Test().method();
                expect(aroundAAdvice).toHaveBeenCalled();
            });

            describe('when there is only one advice executed', () => {
                it('should be empty', () => {
                    aroundAAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });

                    class Test {
                        @AMethod()
                        method(): any {}
                    }
                    expect(aroundAAdvice).not.toHaveBeenCalled();
                    new Test().method();
                    expect(aroundAAdvice).toHaveBeenCalled();
                });
            });

            describe('when there is more than one advice configured', () => {
                it('should hold the next ongoing advice', () => {
                    aroundAAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                        expect(ctxt.advices.length).toEqual(1);
                        expect(ctxt.advices[0].aspect.constructor).toEqual(methodAspectB);
                        ctxt.joinpoint();
                    });

                    aroundBAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });

                    class Test {
                        @AMethod()
                        @BMethod()
                        method(): any {}
                    }

                    [aroundAAdvice, aroundBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                    new Test().method();
                    [aroundAAdvice, aroundBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());
                });
            });

            describe('deleting advices from ctxt.advices', () => {
                it('should prevent the corresponding ongoing advise execution', () => {
                    aroundAAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                        ctxt.advices = [];
                    });

                    class Test {
                        @BMethod()
                        @AMethod()
                        method(): any {}
                    }

                    new Test().method();
                    expect(aroundAAdvice).toHaveBeenCalled();
                    expect(aroundBAdvice).not.toHaveBeenCalled();
                });
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
        describe('attribute "ctxt.advices"', () => {
            it('should exist', () => {
                aroundAAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                    expect(ctxt.advices).toBeDefined();
                    expect(ctxt.advices).toEqual(jasmine.any(Array));
                    ctxt.joinpoint();
                });

                class Test {
                    someMethod(@AParameter() param: any): any {}
                }

                expect(aroundAAdvice).not.toHaveBeenCalled();
                new Test().someMethod('');
                expect(aroundAAdvice).toHaveBeenCalled();
            });

            describe('when there is only one advice executed', () => {
                it('should be empty', () => {
                    aroundAAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });
                    class Test {
                        someMethod(@AParameter() param: any): any {}
                    }

                    expect(aroundAAdvice).not.toHaveBeenCalled();
                    new Test().someMethod('');
                    expect(aroundAAdvice).toHaveBeenCalled();
                });
            });

            describe('when there is more than one advice configured', () => {
                it('should hold the next ongoing advice', () => {
                    aroundAAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                        expect(ctxt.advices.length).toEqual(1);
                        expect(ctxt.advices[0].aspect.constructor).toEqual(parameterAspectB);
                        ctxt.joinpoint();
                    });

                    aroundBAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                        ctxt.joinpoint();
                    });

                    class Test {
                        someMethod(@AParameter() @BParameter() param: any): any {}
                    }

                    [aroundAAdvice, aroundBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                    new Test().someMethod('');
                    [aroundAAdvice, aroundBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());
                });
            });

            describe('deleting advices from ctxt.advices', () => {
                it('should prevent the corresponding ongoing advise execution', () => {
                    aroundAAdvice.and.callFake((ctxt: AroundContext<any, any>) => {
                        ctxt.advices = [];
                    });
                    class Test {
                        someMethod(@BParameter() @AParameter() param: any): any {}
                    }
                    expect(aroundAAdvice).not.toHaveBeenCalled();
                    new Test().someMethod('');
                    expect(aroundAAdvice).toHaveBeenCalled();
                });
            });
        });
    });
});
