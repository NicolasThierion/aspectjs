import { _AClass, _AMethod, _AProperty, _Labeled } from '@root/testing';
import { Around, Aspect, Before, Order } from '@aspectjs/core/annotations';

import Spy = jasmine.Spy;
import { Weaver, WeavingError } from '@aspectjs/weaver';
import { AroundContext } from './around.context';
import { setupAspectTestingContext } from '@aspectjs/core/testing';
import { JoinPoint, AdviceType, BeforeContext, on } from '../../..';

describe('@Around advice', () => {
    let beforeAdvice: Spy;
    let afterAdvice: Spy;
    let aroundAdvice: Spy;
    let aspectClass: any;
    let weaver: Weaver;

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

        weaver = setupAspectTestingContext().weaverContext.getWeaver();
    });

    describe('applied on a class', () => {
        let ctor: Spy;

        beforeEach(() => {
            @Aspect('AClassLabel')
            class AroundClassAspect {
                @Around(on.class.withAnnotations(_AClass))
                apply(ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                    expect(jp).toEqual(ctxt.joinpoint);
                    expect(jpArgs).toEqual(ctxt.args);

                    return aroundAdvice.bind(this)(ctxt, jp, jpArgs);
                }
            }
            aspectClass = AroundClassAspect;

            ctor = jasmine.createSpy('ctor');
            weaver.enable(new AroundClassAspect());
        });
        it('should bind this to the aspect instance', () => {
            aroundAdvice = jasmine.createSpy('aroundAdvice').and.callFake(function () {
                expect(this).toEqual(jasmine.any(aspectClass));
            });

            @_AClass()
            class A {}

            new A();
            expect(aroundAdvice).toHaveBeenCalled();
        });

        it('should call the aspect around the constructor', () => {
            @_AClass()
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

        describe('when the advice calls the joinpoint once', () => {
            beforeEach(() => {
                aroundAdvice = jasmine
                    .createSpy('aroundAdvice')
                    .and.callFake((ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                        jp(['x']);
                        ctxt.instance.labels.push('a');
                    });
            });

            it('should call the original ctor with given args', () => {
                @_AClass()
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

        describe('when the advice calls the joinpoint twice', () => {
            beforeEach(() => {
                aroundAdvice = jasmine
                    .createSpy('aroundAdvice')
                    .and.callFake((ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                        jp(['x']);
                        jp(['y']);
                    });
            });

            it('should throw an error', () => {
                @_AClass()
                class A {
                    labels: string[];
                    constructor(label: string) {
                        ctor();
                        this.labels = [label];
                    }
                }

                expect(() => new A('ctor').labels).toThrow(
                    new WeavingError(
                        'Error applying advice @Around(@AClass) AroundClassAspect.apply() on class "A": joinPoint already proceeded',
                    ),
                );
            });
        });

        describe('and do not call the joinpoint', () => {
            beforeEach(() => {
                aroundAdvice = jasmine
                    .createSpy('aroundAdvice')
                    .and.callFake((ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                        return {
                            labels: ['a'],
                        };
                    });
            });

            it('should not call through original ctor', () => {
                @_AClass()
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
                        @Around(on.class.withAnnotations(_AClass))
                        apply(ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                            labels.push('beforeA');
                            jp(aArgsOverride);
                            labels.push('afterA');
                        }
                    }

                    @Aspect('bAspect')
                    class BAspect {
                        @Around(on.class.withAnnotations(_AClass))
                        apply(ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                            labels.push('beforeB');
                            jp(bArgsOverride);
                            labels.push('afterB');
                        }
                    }
                    weaver.enable(new AAspect(), new BAspect());
                });
                it('should call them nested, in declaration order', () => {
                    @_AClass()
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
                        @_AClass()
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
            describe('when before advice has highest precedence (lowest order)', () => {
                let labels: string[];
                beforeEach(() => {
                    labels = [];

                    @Aspect('aAspect')
                    class AAspect {
                        @Order(1)
                        @Around(on.class.withAnnotations(_AClass))
                        apply(ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                            labels.push('A.around.before');
                            jp();
                            labels.push('A.around.after');
                        }
                    }

                    @Aspect('bAspect')
                    class BAspect {
                        @Order(2)
                        @Before(on.class.withAnnotations(_AClass))
                        apply(ctxt: BeforeContext): void {
                            labels.push('B.before');
                        }
                    }
                    weaver.enable(new AAspect(), new BAspect());
                });
                it('should call @Before advice inside @Around advice', () => {
                    @_AClass()
                    class A {
                        constructor(label: string) {}
                    }

                    new A('ctor');
                    expect(labels).toEqual(['A.around.before', 'B.before', 'A.around.after']);
                });
            });
        });
    });

    describe('applied on a property', () => {
        let a: _Labeled;
        beforeEach(() => {
            @Aspect('APropertyLabel')
            class AroundPropertyAspect {
                @Around(on.property.withAnnotations(_AProperty))
                apply(ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                    expect(jp).toEqual(ctxt.joinpoint);
                    expect(jpArgs).toEqual(ctxt.args);

                    return aroundAdvice.bind(this)(ctxt, jp, jpArgs);
                }
            }
            aspectClass = AroundPropertyAspect;

            weaver.enable(new AroundPropertyAspect());

            class A implements _Labeled {
                @_AProperty()
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
                        .and.callFake((ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                            expect(ctxt.instance).not.toBeNull();
                            return ['around'];
                        });
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
                            (ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint<string[]>, jpArgs: any[]) => {
                                expect(ctxt.instance).not.toBeNull();
                                return jp().concat(['around']);
                            },
                        );
                });

                it('should call the original property setter', () => {
                    expect(a.labels).toEqual(['value', 'around']);
                });
            });

            describe('and do invoke the joinpoint twice', () => {
                beforeEach(() => {
                    aroundAdvice = jasmine
                        .createSpy('aroundAdvice')
                        .and.callFake(
                            (ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint<string[]>, jpArgs: any[]) => {
                                jp();
                                jp();
                            },
                        );
                });

                it('should throw an error', () => {
                    expect(() => a.labels).toThrow(
                        new WeavingError(
                            'Error applying advice @Around(@AProperty) AroundPropertyAspect.apply() on property "A.labels": joinPoint already proceeded',
                        ),
                    );
                });
            });

            describe('and do not return a value', () => {
                beforeEach(() => {
                    @Aspect('APropertyLabel')
                    class AroundPropertyAspect {
                        @Around(on.property.withAnnotations(_AProperty))
                        apply(): void {}
                    }

                    weaver.enable(new AroundPropertyAspect());

                    class A implements _Labeled {
                        @_AProperty()
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
                            @Around(on.property.withAnnotations(_AProperty))
                            apply(ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]): any[] {
                                return ['beforeA'].concat(jp() as []).concat('afterA');
                            }
                        }

                        @Aspect('bAspect')
                        class BAspect {
                            @Around(on.property.withAnnotations(_AProperty))
                            apply(ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]): any[] {
                                return ['beforeB'].concat(jp() as []).concat('afterB');
                            }
                        }
                        weaver.enable(new AAspect(), new BAspect());

                        class A implements _Labeled {
                            @_AProperty()
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
        let a: _Labeled;
        beforeEach(() => {
            @Aspect('APropertyLabel')
            class AroundPropertyAspect {
                @Around(on.property.setter.withAnnotations(_AProperty))
                apply(ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                    expect(jp).toEqual(ctxt.joinpoint);
                    expect(jpArgs).toEqual(ctxt.args);

                    return aroundAdvice.bind(this)(ctxt, jp, jpArgs);
                }
            }
            aspectClass = AroundPropertyAspect;

            weaver.enable(new AroundPropertyAspect());

            class A implements _Labeled {
                @_AProperty()
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
                        .and.callFake((ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                            expect(ctxt.instance).not.toBeNull();
                        });
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
                            (ctxt: AroundContext<_Labeled, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
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
                        @Around(on.property.setter.withAnnotations(_AProperty))
                        apply(ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                            jpArgs[0].push('aroundA');
                            jp(jpArgs);
                        }
                    }

                    @Aspect('bAspect')
                    class BAspect {
                        @Around(on.property.setter.withAnnotations(_AProperty))
                        apply(ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                            jpArgs[0].push('aroundB');
                            jp(jpArgs);
                        }
                    }
                    weaver.enable(new AAspect(), new BAspect());

                    class A implements _Labeled {
                        @_AProperty()
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
        let a: _Labeled;
        beforeEach(() => {
            @Aspect()
            class AroundPropertyAspect {
                @Around(on.method.withAnnotations(_AMethod))
                apply(ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                    expect(jp).toEqual(ctxt.joinpoint);
                    expect(jpArgs).toEqual(ctxt.args);

                    return aroundAdvice.bind(this)(ctxt, jp, jpArgs);
                }
            }
            aspectClass = AroundPropertyAspect;

            weaver.enable(new AroundPropertyAspect());

            class A implements _Labeled {
                public labels: string[] = [];

                @_AMethod()
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
                        .and.callFake((ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {});
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
                            (ctxt: AroundContext<_Labeled, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
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
                        @Around(on.method.withAnnotations(_AMethod))
                        apply(ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                            jpArgs.push('aroundA');
                            jp(jpArgs);
                        }
                    }

                    @Aspect('bAspect')
                    class BAspect {
                        @Around(on.method.withAnnotations(_AMethod))
                        apply(ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                            jpArgs.push('aroundB');
                            jp(jpArgs);
                        }
                    }
                    weaver.enable(new AAspect(), new BAspect());

                    class A implements _Labeled {
                        public labels: string[] = [];

                        @_AMethod()
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
