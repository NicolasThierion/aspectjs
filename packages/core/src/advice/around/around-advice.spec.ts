import { JoinPoint } from '../../weaver/types';
import { AroundContext, BeforeContext } from '../advice-context';
import { WeavingError } from '../../weaver/errors/weaving-error';
import { Around } from './around.decorator';
import { on } from '../pointcut';
import { AClass, AMethod, AProperty, Labeled, setupWeaver } from '../../../testing/src/helpers';
import { Aspect } from '../aspect';
import { AnnotationType } from '../../annotation/annotation.types';
import { Before } from '../before/before.decorator';
import Spy = jasmine.Spy;

describe('@Around advice', () => {
    let beforeAdvice: Spy;
    let afterAdvice: Spy;
    let aroundAdvice: Spy;
    let aspectClass: any;
    beforeEach(() => {
        beforeAdvice = jasmine.createSpy('beforeAdvice');
        afterAdvice = jasmine.createSpy('afterAdvice');

        aroundAdvice = jasmine
            .createSpy('aroundAdvice')
            .and.callFake((ctxt: AroundContext<any, any>, jp: JoinPoint) => {
                beforeAdvice();
                jp();
                afterAdvice();
            });
    });

    describe('applied on a class', () => {
        let ctor: Spy;

        beforeEach(() => {
            @Aspect('AClassLabel')
            class AroundClassAspect {
                @Around(on.class.withAnnotations(AClass))
                apply(ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                    expect(jp).toEqual(ctxt.joinpoint);
                    expect(jpArgs).toEqual(ctxt.args);

                    return aroundAdvice.bind(this)(ctxt, jp, jpArgs);
                }
            }
            aspectClass = AroundClassAspect;

            ctor = jasmine.createSpy('ctor');
            setupWeaver(new AroundClassAspect());
        });
        it('should bind this to the aspect instance', () => {
            aroundAdvice = jasmine.createSpy('aroundAdvice').and.callFake(function () {
                expect(this).toEqual(jasmine.any(aspectClass));
            });

            @AClass()
            class A {}

            new A();
            expect(aroundAdvice).toHaveBeenCalled();
        });

        it('should call the aspect around the constructor', () => {
            @AClass()
            class A {
                constructor() {
                    ctor();
                }
            }

            new A();
            expect(beforeAdvice).toHaveBeenCalled();
            expect(afterAdvice).toHaveBeenCalled();
            expect(ctor).toHaveBeenCalled();
            expect(beforeAdvice).toHaveBeenCalledBefore(ctor);
            expect(ctor).toHaveBeenCalledBefore(afterAdvice);
        });

        describe('"this" value before the joinpoint is called', () => {
            beforeEach(() => {
                aroundAdvice = jasmine
                    .createSpy('aroundAdvice')
                    .and.callFake((ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                        expect(ctxt.instance).not.toBeNull();
                        jp();
                    });
            });

            it('should be null', () => {
                expect(() => {
                    @AClass()
                    class A {
                        constructor() {
                            ctor();
                        }
                    }

                    new A();
                }).toThrow(
                    new WeavingError(
                        '@Around(@AClass) AroundClassAspect.apply(): Cannot call constructor joinpoint when AroundContext.instance was already used',
                    ),
                );
            });
        });

        describe('when referencing "this" after the joinpoint is called', () => {
            beforeEach(() => {
                aroundAdvice = jasmine
                    .createSpy('aroundAdvice')
                    .and.callFake((ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                        jp();
                        ctxt.instance.labels.push('a');
                    });
            });

            it('should not throw', () => {
                @AClass()
                class A {
                    labels: string[];
                    constructor() {
                        ctor();
                        this.labels = ['ctor'];
                    }
                }
                expect(() => {
                    new A();
                }).not.toThrow();

                expect(new A().labels).toEqual(['ctor', 'a']);
            });
        });

        describe('when the advice calls the joinpoint', () => {
            beforeEach(() => {
                aroundAdvice = jasmine
                    .createSpy('aroundAdvice')
                    .and.callFake((ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                        jp(['x']);
                        ctxt.instance.labels.push('a');
                    });
            });

            it('should call the original ctor with given args', () => {
                @AClass()
                class A {
                    labels: string[];
                    constructor(label: string) {
                        ctor();
                        this.labels = [label];
                    }
                }

                expect(new A('ctor').labels).toEqual(['x', 'a']);
            });
        });

        describe('and do not call the joinpoint', () => {
            beforeEach(() => {
                aroundAdvice = jasmine
                    .createSpy('aroundAdvice')
                    .and.callFake((ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                        ctxt.instance.labels = ctxt.instance.labels ?? [];
                        ctxt.instance.labels.push('a');
                    });
            });

            it('should not call through original ctor', () => {
                @AClass()
                class A {
                    labels: string[];
                    constructor(label: string) {
                        ctor();
                        this.labels = [label];
                    }
                }

                expect(ctor).not.toHaveBeenCalled();
                expect(new A('ctor').labels).toEqual(['a']);
            });
        });

        describe('when multiple "around" advices are configured', () => {
            describe('and joinpoint has been called', () => {
                let labels: string[];
                let aArgsOverride: any[] = undefined;
                let bArgsOverride: any[] = undefined;
                beforeEach(() => {
                    aArgsOverride = undefined;
                    bArgsOverride = undefined;
                    labels = [];

                    @Aspect('aAspect')
                    class AAspect {
                        @Around(on.class.withAnnotations(AClass))
                        apply(ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                            labels.push('beforeA');
                            jp(aArgsOverride);
                            labels.push('afterA');
                        }
                    }

                    @Aspect('bAspect')
                    class BAspect {
                        @Around(on.class.withAnnotations(AClass))
                        apply(ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                            labels.push('beforeB');
                            jp(bArgsOverride);
                            labels.push('afterB');
                        }
                    }
                    setupWeaver(new AAspect(), new BAspect());
                });
                it('should call them nested, in declaration order', () => {
                    @AClass()
                    class A {
                        constructor(label: string) {
                            labels.push(label);
                        }
                    }

                    new A('ctor');
                    expect(labels).toEqual(['beforeA', 'beforeB', 'ctor', 'afterB', 'afterA']);
                });

                describe('with joinpoint arguments override', () => {
                    beforeEach(() => {
                        aArgsOverride = ['aArgs'];
                        bArgsOverride = undefined;
                    });

                    it('should pass overridden arguments', () => {
                        @AClass()
                        class A {
                            constructor(label: string) {
                                labels.push(label);
                            }
                        }

                        new A('ctor');
                        expect(labels).toEqual(['beforeA', 'beforeB', 'aArgs', 'afterB', 'afterA']);
                    });
                });
            });
        });

        describe('in conjunction with @Before advices', () => {
            describe('when before advice has higher priority', () => {
                let labels: string[];
                beforeEach(() => {
                    labels = [];

                    @Aspect('aAspect')
                    class AAspect {
                        @Around(on.class.withAnnotations(AClass), {
                            priority: 10,
                        })
                        apply(ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                            labels.push('A.around.before');
                            jp();
                            labels.push('A.around.after');
                        }
                    }

                    @Aspect('bAspect')
                    class BAspect {
                        @Before(on.class.withAnnotations(AClass), {
                            priority: 20,
                        })
                        apply(ctxt: BeforeContext): void {
                            labels.push('beforeB');
                        }
                    }
                    setupWeaver(new AAspect(), new BAspect());
                });
                it('should call @Before advice before @Around advice', () => {
                    @AClass()
                    class A {
                        constructor(label: string) {}
                    }

                    new A('ctor');
                    expect(labels).toEqual(['beforeB', 'A.around.before', 'A.around.after']);
                });
            });
            describe('when before advice has lower priority', () => {
                let labels: string[];
                beforeEach(() => {
                    labels = [];

                    @Aspect('aAspect')
                    class AAspect {
                        @Around(on.class.withAnnotations(AClass), {
                            priority: 2,
                        })
                        aroundA(ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                            labels.push('A.around.before');
                            jp();
                            labels.push('A.around.after');
                        }
                    }

                    @Aspect('bAspect')
                    class BAspect {
                        @Before(on.class.withAnnotations(AClass), {
                            priority: 1,
                        })
                        beforeA(ctxt: BeforeContext): void {
                            labels.push('A.before');
                        }
                    }
                    setupWeaver(new AAspect(), new BAspect());
                });
                xit('should call @Before advice before @Around advice', () => {
                    @AClass()
                    class A {}

                    new A();
                    expect(labels).toEqual(['A.around.before', 'A.before', 'B.around.after']);
                });
            });
        });
    });

    describe('applied on a property', () => {
        let a: Labeled;
        beforeEach(() => {
            @Aspect('APropertyLabel')
            class AroundPropertyAspect {
                @Around(on.property.withAnnotations(AProperty))
                apply(ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                    expect(jp).toEqual(ctxt.joinpoint);
                    expect(jpArgs).toEqual(ctxt.args);

                    return aroundAdvice.bind(this)(ctxt, jp, jpArgs);
                }
            }
            aspectClass = AroundPropertyAspect;

            setupWeaver(new AroundPropertyAspect());

            class A implements Labeled {
                @AProperty()
                public labels: string[] = ['value'];
            }

            a = new A();
        });
        describe('that leverage "around" advice', () => {
            beforeEach(() => {
                aroundAdvice = jasmine.createSpy('aroundAdvice').and.callFake(function (ctxt, jp) {
                    return jp();
                });
            });

            it('should bind this to the aspect instance', () => {
                aroundAdvice = jasmine.createSpy('aroundAdvice').and.callFake(function () {
                    expect(this).toEqual(jasmine.any(aspectClass));
                });

                const labels = a.labels;

                expect(aroundAdvice).toHaveBeenCalled();
            });

            it('should call the aspect around the property', () => {
                console.log(a.labels);
                expect(aroundAdvice).toHaveBeenCalled();
            });

            describe('and do not invoke the joinpoint', () => {
                beforeEach(() => {
                    aroundAdvice = jasmine
                        .createSpy('aroundAdvice')
                        .and.callFake(
                            (ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                                expect(ctxt.instance).not.toBeNull();
                                return ['around'];
                            },
                        );
                });

                it('should not get the original property value', () => {
                    expect(a.labels).toEqual(['around']);
                });
            });

            describe('and do invoke the joinpoint', () => {
                beforeEach(() => {
                    aroundAdvice = jasmine
                        .createSpy('aroundAdvice')
                        .and.callFake(
                            (ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                                expect(ctxt.instance).not.toBeNull();
                                return jp().concat(['around']);
                            },
                        );
                });

                it('should call the original property setter', () => {
                    expect(a.labels).toEqual(['value', 'around']);
                });
            });

            describe('and do not return a value', () => {
                beforeEach(() => {
                    @Aspect('APropertyLabel')
                    class AroundPropertyAspect {
                        @Around(on.property.withAnnotations(AProperty))
                        apply(): void {}
                    }

                    setupWeaver(new AroundPropertyAspect());

                    class A implements Labeled {
                        @AProperty()
                        public labels: string[] = ['value'];
                    }

                    a = new A();
                });
                it('should return undefined', () => {
                    expect(a.labels).toEqual(undefined);
                });
            });
            describe('when multiple "around" advices are configured', () => {
                describe('and joinpoint has been called', () => {
                    beforeEach(() => {
                        @Aspect('aAspect')
                        class AAspect {
                            @Around(on.property.withAnnotations(AProperty))
                            apply(ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]): any[] {
                                return ['beforeA'].concat(jp() as []).concat('afterA');
                            }
                        }

                        @Aspect('bAspect')
                        class BAspect {
                            @Around(on.property.withAnnotations(AProperty))
                            apply(ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]): any[] {
                                return ['beforeB'].concat(jp() as []).concat('afterB');
                            }
                        }
                        setupWeaver(new AAspect(), new BAspect());

                        class A implements Labeled {
                            @AProperty()
                            public labels: string[] = ['value'];
                        }

                        a = new A();
                    });
                    it('should call them nested, in declaration order', () => {
                        expect(a.labels).toEqual(['beforeA', 'beforeB', 'value', 'afterB', 'afterA']);
                    });
                });
            });
        });
    });

    describe('applied on a property setter', () => {
        let a: Labeled;
        beforeEach(() => {
            @Aspect('APropertyLabel')
            class AroundPropertyAspect {
                @Around(on.property.setter.withAnnotations(AProperty))
                apply(ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                    expect(jp).toEqual(ctxt.joinpoint);
                    expect(jpArgs).toEqual(ctxt.args);

                    return aroundAdvice.bind(this)(ctxt, jp, jpArgs);
                }
            }
            aspectClass = AroundPropertyAspect;

            setupWeaver(new AroundPropertyAspect());

            class A implements Labeled {
                @AProperty()
                public labels: string[] = ['value'];
            }

            a = new A();
        });
        describe('that leverage "around" advice', () => {
            it('should bind this to the aspect instance', () => {
                aroundAdvice = jasmine.createSpy('aroundAdvice').and.callFake(function () {
                    expect(this).toEqual(jasmine.any(aspectClass));
                });

                a.labels = [];

                expect(aroundAdvice).toHaveBeenCalled();
            });

            beforeEach(() => {
                aroundAdvice = jasmine.createSpy('aroundAdvice').and.callFake(function (ctxt, jp) {
                    return jp();
                });
            });

            it('should call the aspect', () => {
                expect(aroundAdvice).not.toHaveBeenCalled();
                a.labels = ['newValue'];
                expect(aroundAdvice).toHaveBeenCalled();
            });

            it('should set the property to the value returned by the advice', () => {
                a.labels = ['newValue'];
                expect(a.labels).toEqual(['newValue']);
            });

            describe('and do not invoke the joinpoint', () => {
                beforeEach(() => {
                    aroundAdvice = jasmine
                        .createSpy('aroundAdvice')
                        .and.callFake(
                            (ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                                expect(ctxt.instance).not.toBeNull();
                            },
                        );
                });

                it('should not call the original property setter', () => {
                    a.labels = ['newValue'];
                    expect(a.labels).toEqual(['value']);
                });
            });

            describe('and do invoke the joinpoint', () => {
                beforeEach(() => {
                    aroundAdvice = jasmine
                        .createSpy('aroundAdvice')
                        .and.callFake(
                            (ctxt: AroundContext<Labeled, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                                expect(ctxt.instance).not.toBeNull();
                                return jp([
                                    []
                                        .concat('beforeAround')
                                        .concat(ctxt.instance.labels)
                                        .concat(jpArgs[0])
                                        .concat('overrideArgs')
                                        .concat('afterAround'),
                                ]);
                            },
                        );
                });

                it('should call the original property setter', () => {
                    a.labels = ['newValue'];
                    expect(a.labels).toEqual(['beforeAround', 'value', 'newValue', 'overrideArgs', 'afterAround']);
                });
            });
        });
        describe('when multiple "around" advices are configured', () => {
            describe('and joinpoint has been called', () => {
                beforeEach(() => {
                    @Aspect('aAspect')
                    class AAspect {
                        @Around(on.property.setter.withAnnotations(AProperty))
                        apply(ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                            jpArgs[0].push('aroundA');
                            jp(jpArgs);
                        }
                    }

                    @Aspect('bAspect')
                    class BAspect {
                        @Around(on.property.setter.withAnnotations(AProperty))
                        apply(ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                            jpArgs[0].push('aroundB');
                            jp(jpArgs);
                        }
                    }
                    setupWeaver(new AAspect(), new BAspect());

                    class A implements Labeled {
                        @AProperty()
                        public labels: string[];
                    }

                    a = new A();
                });
                it('should call them nested, in declaration order', () => {
                    a.labels = ['newValue'];
                    expect(a.labels).toEqual(['newValue', 'aroundA', 'aroundB']);
                });
            });
        });
    });

    describe('applied on a method', () => {
        let a: Labeled;
        beforeEach(() => {
            @Aspect()
            class AroundPropertyAspect {
                @Around(on.method.withAnnotations(AMethod))
                apply(ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                    expect(jp).toEqual(ctxt.joinpoint);
                    expect(jpArgs).toEqual(ctxt.args);

                    return aroundAdvice.bind(this)(ctxt, jp, jpArgs);
                }
            }
            aspectClass = AroundPropertyAspect;

            setupWeaver(new AroundPropertyAspect());

            class A implements Labeled {
                public labels: string[] = [];

                @AMethod()
                addLabel(...labels: string[]) {
                    return (this.labels = this.labels.concat(labels));
                }
            }

            a = new A();
        });
        describe('that leverage "around" advice', () => {
            beforeEach(() => {
                aroundAdvice = jasmine.createSpy('aroundAdvice').and.callFake(function (ctxt, jp) {
                    return jp();
                });
            });

            it('should bind this to the aspect instance', () => {
                aroundAdvice = jasmine.createSpy('aroundAdvice').and.callFake(function () {
                    expect(this).toEqual(jasmine.any(aspectClass));
                });

                a.addLabel();

                expect(aroundAdvice).toHaveBeenCalled();
            });

            describe('calling the method', () => {
                it('should call the aspect', () => {
                    expect(aroundAdvice).not.toHaveBeenCalled();
                    a.addLabel();
                    expect(aroundAdvice).toHaveBeenCalled();
                });

                it('should return the value returned by the advice', () => {
                    aroundAdvice = jasmine.createSpy('aroundAdvice').and.callFake(function (ctxt, jp) {
                        return ['newValue'];
                    });
                    expect(a.addLabel()).toEqual(['newValue']);
                });
            });

            describe('and do not invoke the joinpoint', () => {
                beforeEach(() => {
                    aroundAdvice = jasmine
                        .createSpy('aroundAdvice')
                        .and.callFake(
                            (ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {},
                        );
                });

                describe('calling the method', () => {
                    it('should not call the original method', () => {
                        expect(a.labels).toEqual([]);
                        a.addLabel('notAdded');
                        expect(a.labels).toEqual([]);
                    });
                });
            });

            describe('and do invoke the joinpoint', () => {
                beforeEach(() => {
                    aroundAdvice = jasmine
                        .createSpy('aroundAdvice')
                        .and.callFake(
                            (ctxt: AroundContext<Labeled, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                                expect(ctxt.instance).not.toBeNull();
                                return jp(
                                    []
                                        .concat('beforeAround')
                                        .concat(jpArgs[0])
                                        .concat('overrideArgs')
                                        .concat('afterAround'),
                                );
                            },
                        );
                });

                describe('calling the method', () => {
                    it('should call the original method', () => {
                        const res = a.addLabel('newValue');
                        expect(a.labels).toEqual(['beforeAround', 'newValue', 'overrideArgs', 'afterAround']);
                        expect(res).toEqual(a.labels);
                    });
                });
            });
        });
        describe('when multiple "around" advices are configured', () => {
            describe('and joinpoint has been called', () => {
                beforeEach(() => {
                    @Aspect('aAspect')
                    class AAspect {
                        @Around(on.method.withAnnotations(AMethod))
                        apply(ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                            jpArgs.push('aroundA');
                            return jp(jpArgs);
                        }
                    }

                    @Aspect('bAspect')
                    class BAspect {
                        @Around(on.method.withAnnotations(AMethod))
                        apply(ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                            jpArgs.push('aroundB');
                            return jp(jpArgs);
                        }
                    }
                    setupWeaver(new AAspect(), new BAspect());

                    class A implements Labeled {
                        public labels: string[] = [];

                        @AMethod()
                        addLabel(...labels: string[]) {
                            return (this.labels = this.labels.concat(labels));
                        }
                    }

                    a = new A();
                });
                it('should call them nested, in declaration order', () => {
                    a.addLabel('newValue');
                    expect(a.labels).toEqual(['newValue', 'aroundA', 'aroundB']);
                });
            });
        });
    });
    xdescribe('applied on a method parameter', () => {
        describe('that leverage "around" advice', () => {
            describe('calling the method', () => {
                it('should call the aspect', () => {});

                it('should return the value returned by the advice', () => {});
            });

            describe('and do not invoke the joinpoint', () => {
                describe('calling the method', () => {
                    it('should not call the original method', () => {});
                });
            });

            describe('and do invoke the joinpoint', () => {
                describe('calling the method', () => {
                    it('should call the original method', () => {});
                });
            });
        });
        describe('when multiple "around" advices are configured', () => {
            describe('and joinpoint has been called', () => {
                it('should call them nested, in declaration order', () => {});
            });
        });
    });
});
