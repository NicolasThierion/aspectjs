import { AdviceContext, AfterContext, AfterThrowContext } from '../advice-context';
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
import { AfterThrow } from './after-throw.decorator';
import { After } from '../after/after.decorator';

describe('AfterThrowContext', () => {
    let weaver: Weaver;
    let afterThrowAAdvice = jasmine.createSpy('afterThrowAAdvice');
    let afterThrowBAdvice = jasmine.createSpy('afterThrowBAdvice');
    let afterAAdvice = jasmine.createSpy('afterAAdvice');
    let afterBAdvice = jasmine.createSpy('afterBAdvice');

    beforeEach(() => {
        setWeaver((weaver = new LoadTimeWeaver()));
        afterThrowAAdvice = jasmine.createSpy('afterThrowAAdvice');
        afterThrowBAdvice = jasmine.createSpy('afterThrowBAdvice');
        afterAAdvice = jasmine.createSpy('afterAAdvice');
        afterBAdvice = jasmine.createSpy('afterBAdvice');
    });

    describe('on a class', () => {
        let classAspectB: any;
        beforeEach(() => {
            @Aspect()
            class ClassAspectA {
                @AfterThrow(on.class.withAnnotations(AClass), { priority: 10 })
                afterThrowA(ctxt: AfterThrowContext<any, AnnotationType.PROPERTY>): void {
                    afterThrowAAdvice(ctxt);
                }

                @After(on.class.withAnnotations(AClass), { priority: 10 })
                afterA(ctxt: AfterContext<any, AnnotationType.PROPERTY>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class ClassAspectB {
                @AfterThrow(on.class.withAnnotations(BClass), { priority: 9 })
                afterThrowB(ctxt: AfterThrowContext<any, AnnotationType.PROPERTY>): void {
                    afterThrowBAdvice(ctxt);
                }

                @After(on.class.withAnnotations(BClass), { priority: 9 })
                afterB(ctxt: AfterContext<any, AnnotationType.PROPERTY>): void {
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

                afterThrowAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterThrowA'));
                afterThrowBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterThrowB'));
            });
            it('should be shared across two @AfterThrow advices on the same class', () => {
                @AClass()
                @BClass()
                class Test {
                    constructor() {
                        throw new Error();
                    }
                }
                new Test();
                expect(afterThrowAAdvice).toHaveBeenCalled();
                expect(afterThrowBAdvice).toHaveBeenCalled();
                expect(data.advices).toEqual(['afterThrowA', 'afterThrowB']);
            });

            it('should not shared across two @AfterThrow advices on different classes', () => {
                @AClass()
                class Test1 {
                    constructor() {
                        throw new Error();
                    }
                }
                new Test1();
                expect(data.advices).toEqual(['afterThrowA']);
                @BClass()
                class Test2 {
                    constructor() {
                        throw new Error();
                    }
                }
                new Test2();

                expect(data.advices).toEqual(['afterThrowB']);
            });

            it('should be shared between a @AfterThrow and a @After advice on the same class', () => {
                afterAAdvice.and.callFake((ctxt: AfterContext<any, any>) => pushData(ctxt, 'afterA'));
                afterBAdvice.and.callFake((ctxt: AfterContext<any, any>) => pushData(ctxt, 'afterB'));

                @AClass()
                @BClass()
                class Test {
                    constructor() {
                        throw new Error();
                    }
                }
                new Test();
                expect(data.advices).toEqual(['afterThrowA', 'afterThrowB', 'afterA', 'afterB']);
            });
        });
        describe('attribute "ctxt.advices"', () => {
            it('should exist', () => {
                afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                    expect(ctxt.advices).toBeDefined();
                    expect(ctxt.advices).toEqual(jasmine.any(Array));
                });

                @AClass()
                class Test {
                    constructor() {
                        throw new Error();
                    }
                }

                expect(afterThrowAAdvice).not.toHaveBeenCalled();
                new Test();
                expect(afterThrowAAdvice).toHaveBeenCalled();
            });

            describe('when there is only one advice executed', () => {
                it('should be empty', () => {
                    afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });

                    @AClass()
                    class Test {
                        constructor() {
                            throw new Error();
                        }
                    }

                    expect(afterThrowAAdvice).not.toHaveBeenCalled();
                    new Test();
                    expect(afterThrowAAdvice).toHaveBeenCalled();
                });
            });

            describe('when there is more than one advice configured', () => {
                it('should hold the next ongoing advice', () => {
                    afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                        expect(ctxt.advices.length).toEqual(1);
                        expect(ctxt.advices[0].aspect.constructor).toEqual(classAspectB);
                    });

                    afterThrowBAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });

                    @AClass()
                    @BClass()
                    class Test {
                        constructor() {
                            throw new Error();
                        }
                    }
                    [afterThrowAAdvice, afterThrowBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
                    new Test();
                    [afterThrowAAdvice, afterThrowBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
                });
            });

            describe('deleting advices from ctxt.advices', () => {
                it('should prevent the corresponding ongoing advise execution', () => {
                    afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                        ctxt.advices = [];
                    });

                    @BClass()
                    @AClass()
                    class Test {
                        constructor() {
                            throw new Error();
                        }
                    }
                    [afterThrowAAdvice, afterThrowBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
                    new Test();
                    expect(afterThrowAAdvice).toHaveBeenCalled();
                });
            });
        });
    });

    describe('on a property', () => {
        let propertyAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @AfterThrow(on.property.withAnnotations(AProperty), { priority: 10 })
                aroundA(ctxt: AfterThrowContext<any, AnnotationType.CLASS>): void {
                    afterThrowAAdvice(ctxt);
                }

                @After(on.property.withAnnotations(AProperty), { priority: 10 })
                afterReturnA(ctxt: AfterContext<any, AnnotationType.CLASS>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @AfterThrow(on.property.withAnnotations(BProperty), { priority: 9 })
                aroundB(ctxt: AfterThrowContext<any, AnnotationType.CLASS>): void {
                    afterThrowBAdvice(ctxt);
                }

                @After(on.property.withAnnotations(BProperty), { priority: 9 })
                afterReturnB(ctxt: AfterContext<any, AnnotationType.CLASS>): void {
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

                afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                    pushData(ctxt, 'afterThrowA');
                });
                afterThrowBAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                    pushData(ctxt, 'afterThrowB');
                });
            });
            it('should be shared across two @AfterThrow advices on the same property', () => {
                class Test {
                    @AProperty()
                    @BProperty()
                    get prop() {
                        throw new Error();
                    }
                }

                [afterThrowAAdvice, afterThrowBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
                new Test().prop;
                [afterThrowAAdvice, afterThrowBAdvice].forEach((f) => expect(f).toHaveBeenCalled());
                expect(data.advices).toEqual(['afterThrowA', 'afterThrowB']);
            });

            it('should not shared across two @AfterThrow advices on different properties', () => {
                @AClass()
                class Test {
                    @AProperty()
                    get prop1() {
                        throw new Error();
                    }
                    @BProperty()
                    get prop2() {
                        throw new Error();
                    }
                }
                const t = new Test();

                [afterThrowAAdvice, afterThrowBAdvice].forEach((f) => expect(f).not.toHaveBeenCalled());
                t.prop1;
                t.prop2;
                [afterThrowAAdvice, afterThrowBAdvice].forEach((f) => expect(f).toHaveBeenCalled());

                expect(data.advices).toEqual(['afterThrowB']);
            });

            it('should be shared between a @AfterThrow and a @After advice on the same property', () => {
                afterAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterA'));
                afterBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterB'));

                class Test {
                    @AProperty()
                    @BProperty()
                    get prop() {
                        throw new Error();
                    }
                }

                [afterThrowAAdvice, afterThrowBAdvice, afterAAdvice, afterBAdvice].forEach((f) =>
                    expect(f).not.toHaveBeenCalled(),
                );
                new Test().prop;
                [afterThrowAAdvice, afterThrowBAdvice, afterAAdvice, afterBAdvice].forEach((f) =>
                    expect(f).toHaveBeenCalled(),
                );
                expect(data.advices).toEqual(['afterThrowA', 'afterThrowB', 'afterA', 'afterB']);
            });
        });
        describe('attribute "ctxt.advices"', () => {
            it('should exist', () => {
                afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                    expect(ctxt.advices).toBeDefined();
                    expect(ctxt.advices).toEqual(jasmine.any(Array));
                });

                class Test {
                    @AProperty()
                    get prop() {
                        throw new Error();
                    }
                }

                expect(afterThrowAAdvice).not.toHaveBeenCalled();
                new Test().prop;
                expect(afterThrowAAdvice).toHaveBeenCalled();
            });

            describe('when there is only one advice executed', () => {
                it('should be empty', () => {
                    afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });

                    class Test {
                        @AProperty()
                        get prop() {
                            throw new Error();
                        }
                    }

                    expect(afterThrowAAdvice).not.toHaveBeenCalled();
                    new Test().prop;
                    expect(afterThrowAAdvice).toHaveBeenCalled();
                });
            });

            describe('when there is more than one advice configured', () => {
                it('should hold the next ongoing advice', () => {
                    afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                        expect(ctxt.advices.length).toEqual(1);
                        expect(ctxt.advices[0].aspect.constructor).toEqual(propertyAspectB);
                    });

                    afterThrowBAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });

                    class Test {
                        @AProperty()
                        @BProperty()
                        get prop() {
                            throw new Error();
                        }
                    }
                    [afterThrowAAdvice, afterThrowBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                    new Test().prop;
                    [afterThrowAAdvice, afterThrowBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());
                });
            });

            describe('deleting advices from ctxt.advices', () => {
                it('should prevent the corresponding ongoing advise execution', () => {
                    afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                        ctxt.advices = [];
                    });

                    class Test {
                        @BProperty()
                        @AProperty()
                        get prop() {
                            throw new Error();
                        }
                    }
                    [afterThrowAAdvice, afterThrowBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                    new Test().prop;
                    [afterThrowAAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());
                });
            });
        });
    });

    describe('on a property setter', () => {
        let propertyAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @AfterThrow(on.property.setter.withAnnotations(AProperty), { priority: 10 })
                aroundA(ctxt: AfterThrowContext<any, AnnotationType.CLASS>): void {
                    afterThrowAAdvice(ctxt);
                }

                @After(on.property.setter.withAnnotations(AProperty), { priority: 10 })
                afterReturnA(ctxt: AfterContext<any, AnnotationType.CLASS>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @AfterThrow(on.property.setter.withAnnotations(BProperty), { priority: 9 })
                aroundB(ctxt: AfterThrowContext<any, AnnotationType.CLASS>): void {
                    afterThrowBAdvice(ctxt);
                }

                @After(on.property.setter.withAnnotations(BProperty), { priority: 9 })
                afterReturnB(ctxt: AfterContext<any, AnnotationType.CLASS>): void {
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

                afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                    pushData(ctxt, 'afterThrowA');
                });
                afterThrowBAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                    pushData(ctxt, 'afterThrowB');
                });
            });
            it('should be shared across two @AfterThrow advices on the same property', () => {
                class Test {
                    @AProperty()
                    @BProperty()
                    set prop(x: any) {
                        throw new Error();
                    }
                }
                [afterThrowAAdvice, afterThrowBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                new Test().prop = 'toto';
                [afterThrowAAdvice, afterThrowBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());
                expect(data.advices).toEqual(['afterThrowA', 'afterThrowB']);
            });

            it('should not shared across two @AfterThrow advices on different properties', () => {
                @AClass()
                class Test {
                    @AProperty()
                    set prop1(x: any) {
                        throw new Error();
                    }

                    @BProperty()
                    set prop2(x: any) {
                        throw new Error();
                    }
                }

                [afterThrowAAdvice, afterThrowBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                const t = new Test();
                t.prop1 = 'toto';
                t.prop2 = 'toto';
                [afterThrowAAdvice, afterThrowBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());

                expect(data.advices).toEqual(['afterThrowB']);
            });

            it('should be shared between a @AfterThrow and a @After advice on the same property', () => {
                afterAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterA'));
                afterBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterB'));

                class Test {
                    @AProperty()
                    @BProperty()
                    set prop(x: any) {
                        throw new Error();
                    }
                }
                [afterThrowAAdvice, afterThrowBAdvice, afterAAdvice, afterBAdvice].forEach((fn) =>
                    expect(fn).not.toHaveBeenCalled(),
                );
                new Test().prop = '';
                [afterThrowAAdvice, afterThrowBAdvice, afterAAdvice, afterBAdvice].forEach((fn) =>
                    expect(fn).toHaveBeenCalled(),
                );
                expect(data.advices).toEqual(['afterThrowA', 'afterThrowB', 'afterA', 'afterB']);
            });
        });
        describe('attribute "ctxt.advices"', () => {
            it('should exist', () => {
                afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                    expect(ctxt.advices).toBeDefined();
                    expect(ctxt.advices).toEqual(jasmine.any(Array));
                });

                class Test {
                    @AProperty()
                    set prop(x: any) {
                        throw new Error();
                    }
                }

                new Test().prop = '';
                expect(afterThrowAAdvice).toHaveBeenCalled();
            });

            describe('when there is only one advice executed', () => {
                it('should be empty', () => {
                    afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });

                    class Test {
                        @AProperty()
                        set prop(x: any) {
                            throw new Error();
                        }
                    }
                    new Test().prop = '';

                    expect(afterThrowAAdvice).toHaveBeenCalled();
                });
            });

            describe('when there is more than one advice configured', () => {
                it('should hold the next ongoing advice', () => {
                    afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                        expect(ctxt.advices.length).toEqual(1);
                        expect(ctxt.advices[0].aspect.constructor).toEqual(propertyAspectB);
                    });

                    afterThrowBAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });

                    class Test {
                        @AProperty()
                        @BProperty()
                        set prop(x: any) {
                            throw new Error();
                        }
                    }
                    new Test().prop = '';

                    expect(afterThrowAAdvice).toHaveBeenCalled();
                    expect(afterThrowBAdvice).toHaveBeenCalled();
                });
            });

            describe('deleting advices from ctxt.advices', () => {
                it('should prevent the corresponding ongoing advise execution', () => {
                    afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                        ctxt.advices = [];
                    });

                    class Test {
                        @BProperty()
                        @AProperty()
                        set prop(x: any) {
                            throw new Error();
                        }
                    }
                    new Test().prop = '';

                    expect(afterThrowAAdvice).toHaveBeenCalled();
                    expect(afterThrowBAdvice).not.toHaveBeenCalled();
                });
            });
        });
    });

    describe('on a method', () => {
        let methodAspectB: any;
        beforeEach(() => {
            @Aspect()
            class PropertyAspectA {
                @AfterThrow(on.method.withAnnotations(AMethod), { priority: 10 })
                aroundA(ctxt: AfterThrowContext<any, AnnotationType.METHOD>): void {
                    afterThrowAAdvice(ctxt);
                }

                @After(on.method.withAnnotations(AMethod), { priority: 10 })
                afterReturnA(ctxt: AfterContext<any, AnnotationType.METHOD>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class PropertyAspectB {
                @AfterThrow(on.method.withAnnotations(BMethod), { priority: 9 })
                aroundB(ctxt: AfterThrowContext<any, AnnotationType.METHOD>): void {
                    afterThrowBAdvice(ctxt);
                }

                @After(on.method.withAnnotations(BMethod), { priority: 9 })
                afterReturnB(ctxt: AfterContext<any, AnnotationType.METHOD>): void {
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

                afterThrowAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterThrowA'));
                afterThrowBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterThrowB'));
            });

            it('should be shared across two @AfterThrow advices on the same method', () => {
                class Test {
                    @AMethod()
                    @BMethod()
                    someMethod(): any {
                        throw new Error();
                    }
                }
                [afterThrowAAdvice, afterThrowBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                new Test().someMethod();
                [afterThrowAAdvice, afterThrowBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());

                expect(data.advices).toEqual(['afterThrowA', 'afterThrowB']);
            });

            it('should not shared across two @AfterThrow advices on different method', () => {
                @AClass()
                class Test {
                    @AMethod()
                    method1(): any {
                        throw new Error();
                    }

                    @BMethod()
                    method2(): any {
                        throw new Error();
                    }
                }

                [afterThrowAAdvice, afterThrowBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                const t = new Test();
                t.method1();
                t.method2();
                [afterThrowAAdvice, afterThrowBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());

                expect(data.advices).toEqual(['afterThrowB']);
            });

            it('should be shared between a @AfterThrow and a @After advice on the same method', () => {
                afterAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterA'));
                afterBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterB'));

                class Test {
                    @AMethod()
                    @BMethod()
                    method(): any {
                        throw new Error();
                    }
                }

                new Test().method();
                expect(data.advices).toEqual(['afterThrowA', 'afterThrowB', 'afterA', 'afterB']);
            });
        });
        describe('attribute "ctxt.advices"', () => {
            it('should exist', () => {
                afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                    expect(ctxt.advices).toBeDefined();
                    expect(ctxt.advices).toEqual(jasmine.any(Array));
                });

                class Test {
                    @AMethod()
                    method(): any {
                        throw new Error();
                    }
                }

                expect(afterThrowAAdvice).not.toHaveBeenCalled();
                new Test().method();
                expect(afterThrowAAdvice).toHaveBeenCalled();
            });

            describe('when there is only one advice executed', () => {
                it('should be empty', () => {
                    afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });

                    class Test {
                        @AMethod()
                        method(): any {
                            throw new Error();
                        }
                    }
                    expect(afterThrowAAdvice).not.toHaveBeenCalled();
                    new Test().method();
                    expect(afterThrowAAdvice).toHaveBeenCalled();
                });
            });

            describe('when there is more than one advice configured', () => {
                it('should hold the next ongoing advice', () => {
                    afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                        expect(ctxt.advices.length).toEqual(1);
                        expect(ctxt.advices[0].aspect.constructor).toEqual(methodAspectB);
                    });

                    afterThrowBAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });

                    class Test {
                        @AMethod()
                        @BMethod()
                        method(): any {
                            throw new Error();
                        }
                    }

                    [afterThrowAAdvice, afterThrowBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                    new Test().method();
                    [afterThrowAAdvice, afterThrowBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());
                });
            });

            describe('deleting advices from ctxt.advices', () => {
                it('should prevent the corresponding ongoing advise execution', () => {
                    afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                        ctxt.advices = [];
                    });

                    class Test {
                        @BMethod()
                        @AMethod()
                        method(): any {
                            throw new Error();
                        }
                    }

                    new Test().method();
                    expect(afterThrowAAdvice).toHaveBeenCalled();
                    expect(afterThrowBAdvice).not.toHaveBeenCalled();
                });
            });
        });
    });

    describe('on a parameter', () => {
        let parameterAspectB: any;
        beforeEach(() => {
            @Aspect()
            class ParameterAspectA {
                @AfterThrow(on.parameter.withAnnotations(AParameter), { priority: 10 })
                aroundA(ctxt: AfterThrowContext<any, AnnotationType.PARAMETER>): void {
                    afterThrowAAdvice(ctxt);
                }

                @After(on.parameter.withAnnotations(AParameter), { priority: 10 })
                afterReturnA(ctxt: AfterContext<any, AnnotationType.PARAMETER>): void {
                    afterAAdvice(ctxt);
                }
            }
            @Aspect()
            class ParameterAspectB {
                @AfterThrow(on.parameter.withAnnotations(BParameter), { priority: 9 })
                aroundB(ctxt: AfterThrowContext<any, AnnotationType.PARAMETER>): void {
                    afterThrowBAdvice(ctxt);
                }

                @After(on.parameter.withAnnotations(BParameter), { priority: 9 })
                afterReturnB(ctxt: AfterContext<any, AnnotationType.PARAMETER>): void {
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

                afterThrowAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterThrowA'));
                afterThrowBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterThrowB'));
            });
            it('should be shared across two @AfterThrow advices on the same parameter', () => {
                class Test {
                    someMethod(@AParameter() @BParameter() param: any): any {
                        throw new Error();
                    }
                }

                new Test().someMethod('');

                expect(data.advices).toEqual(['afterThrowA', 'afterThrowB']);
            });

            it('should not shared across two @AfterThrow advices on different parameters', () => {
                class Test {
                    someMethod(@AParameter() paramA: any, @BParameter() paramB: any): any {
                        throw new Error();
                    }
                }
                new Test().someMethod('', '');

                expect(data.advices).toEqual(['afterThrowA']);
            });

            it('should be shared between a @AfterThrow and a @After advice on the same parameters', () => {
                afterAAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterA'));
                afterBAdvice.and.callFake((ctxt) => pushData(ctxt, 'afterB'));

                class Test {
                    someMethod(@AParameter() @BParameter() param: any): any {
                        throw new Error();
                    }
                }

                new Test().someMethod('');
                expect(data.advices).toEqual(['afterThrowA', 'afterThrowB', 'afterA', 'afterB']);
            });
        });
        describe('attribute "ctxt.advices"', () => {
            it('should exist', () => {
                afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                    expect(ctxt.advices).toBeDefined();
                    expect(ctxt.advices).toEqual(jasmine.any(Array));
                });

                class Test {
                    someMethod(@AParameter() param: any): any {
                        throw new Error();
                    }
                }

                expect(afterThrowAAdvice).not.toHaveBeenCalled();
                new Test().someMethod('');
                expect(afterThrowAAdvice).toHaveBeenCalled();
            });

            describe('when there is only one advice executed', () => {
                it('should be empty', () => {
                    afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });
                    class Test {
                        someMethod(@AParameter() param: any): any {
                            throw new Error();
                        }
                    }

                    expect(afterThrowAAdvice).not.toHaveBeenCalled();
                    new Test().someMethod('');
                    expect(afterThrowAAdvice).toHaveBeenCalled();
                });
            });

            describe('when there is more than one advice configured', () => {
                it('should hold the next ongoing advice', () => {
                    afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                        expect(ctxt.advices.length).toEqual(1);
                        expect(ctxt.advices[0].aspect.constructor).toEqual(parameterAspectB);
                    });

                    afterThrowBAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                        expect(ctxt.advices).toEqual([]);
                    });

                    class Test {
                        someMethod(@AParameter() @BParameter() param: any): any {
                            throw new Error();
                        }
                    }

                    [afterThrowAAdvice, afterThrowBAdvice].forEach((fn) => expect(fn).not.toHaveBeenCalled());
                    new Test().someMethod('');
                    [afterThrowAAdvice, afterThrowBAdvice].forEach((fn) => expect(fn).toHaveBeenCalled());
                });
            });

            describe('deleting advices from ctxt.advices', () => {
                it('should prevent the corresponding ongoing advise execution', () => {
                    afterThrowAAdvice.and.callFake((ctxt: AfterThrowContext<any, any>) => {
                        ctxt.advices = [];
                    });
                    class Test {
                        someMethod(@BParameter() @AParameter() param: any): any {
                            throw new Error();
                        }
                    }
                    expect(afterThrowAAdvice).not.toHaveBeenCalled();
                    new Test().someMethod('');
                    expect(afterThrowAAdvice).toHaveBeenCalled();
                });
            });
        });
    });
});
