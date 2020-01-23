import { Aspect, JoinPoint } from '../../types';
import { AdviceType, AroundAdvice } from '../types';
import { AClass } from '../../../tests/a';
import { AroundContext } from '../advice-context';
import { WeavingError } from '../../weaving-error';
import { Around } from './around.decorator';
import { on } from '../pointcut';
import { AProperty, Labeled, setupWeaver } from '../../../tests/helpers';
import Spy = jasmine.Spy;

describe('@Around advice', () => {
    let beforeAdvice: Spy;
    let afterAdvice: Spy;
    let aroundAdvice: Spy;

    beforeEach(() => {
        beforeAdvice = jasmine.createSpy('beforeAdvice');
        afterAdvice = jasmine.createSpy('afterAdvice');

        aroundAdvice = jasmine
            .createSpy('aroundAdvice', (ctxt: AroundContext<any, any>, jp: JoinPoint) => {
                beforeAdvice();
                jp();
                afterAdvice();
            })
            .and.callThrough();
    });

    describe('applied on a class', () => {
        let ctor: Spy;

        beforeEach(() => {
            class AroundClassAspect extends Aspect {
                id = 'AClassLabel';

                @Around(on.class.annotations(AClass))
                apply(ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                    expect(this).toEqual(jasmine.any(AroundClassAspect));
                    expect(jp).toEqual(ctxt.joinpoint);
                    expect(jpArgs).toEqual(ctxt.joinpointArgs);

                    return aroundAdvice(ctxt, jp, jpArgs);
                }
            }

            ctor = jasmine.createSpy('ctor');
            setupWeaver(new AroundClassAspect());
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

        describe('when referencing "this" before the joinpoint is called', () => {
            beforeEach(() => {
                aroundAdvice = jasmine
                    .createSpy(
                        'aroundAdvice',
                        (ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                            expect(ctxt.instance).not.toBeNull();
                            jp();
                        },
                    )
                    .and.callThrough();
            });

            it('should throw', () => {
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
                        'In advice "@Around(@AClass) AroundClassAspect.apply()": Cannot get "this" instance of constructor before calling constructor joinpoint',
                    ),
                );
            });
        });

        describe('when referencing "this" after the joinpoint is called', () => {
            beforeEach(() => {
                aroundAdvice = jasmine
                    .createSpy(
                        'aroundAdvice',
                        (ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                            jp();
                            ctxt.instance.labels.push('a');
                        },
                    )
                    .and.callThrough();
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
                    .createSpy(
                        'aroundAdvice',
                        (ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                            jp(['x']);
                            ctxt.instance.labels.push('a');
                        },
                    )
                    .and.callThrough();
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
                    .createSpy(
                        'aroundAdvice',
                        (ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                            ctxt.instance.labels = ctxt.instance.labels ?? [];
                            ctxt.instance.labels.push('a');
                        },
                    )
                    .and.callThrough();
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

                class AAspect extends Aspect {
                    id = 'aAspect';

                    @Around(on.class.annotations(AClass))
                    apply(ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                        labels.push('beforeA');
                        jp(aArgsOverride);
                        labels.push('afterA');
                    }
                }

                class BAspect extends Aspect {
                    id = 'bAspect';

                    @Around(on.class.annotations(AClass))
                    apply(ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
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
                expect(labels).toEqual(['beforeB', 'beforeA', 'ctor', 'afterA', 'afterB']);
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
                    expect(labels).toEqual(['beforeB', 'beforeA', 'aArgs', 'afterA', 'afterB']);
                });
            });
        });
    });

    describe('applied on a property', () => {
        let a: Labeled;
        beforeEach(() => {
            class AroundPropertyAspect extends Aspect {
                id = 'APropertyLabel';

                @Around(on.property.annotations(AProperty))
                apply(ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                    expect(this).toEqual(jasmine.any(AroundPropertyAspect));

                    expect(jp).toEqual(ctxt.joinpoint);
                    expect(jpArgs).toEqual(ctxt.joinpointArgs);

                    return aroundAdvice(ctxt, jp, jpArgs);
                }
            }

            setupWeaver(new AroundPropertyAspect());

            class A implements Labeled {
                @AProperty()
                public labels: string[] = ['value'];
            }

            a = new A();
        });
        describe('that leverage "around" advice', () => {
            beforeEach(() => {
                aroundAdvice = jasmine
                    .createSpy('aroundAdvice', function(ctxt, jp) {
                        return jp();
                    })
                    .and.callThrough();
            });

            it('should call the aspect around the property', () => {
                console.log(a.labels);
                expect(aroundAdvice).toHaveBeenCalled();
            });

            describe('and do not invoke the joinpoint', () => {
                beforeEach(() => {
                    aroundAdvice = jasmine
                        .createSpy(
                            'aroundAdvice',
                            (ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                                expect(ctxt.instance).not.toBeNull();
                                return ['around'];
                            },
                        )
                        .and.callThrough();
                });

                it('should not get the original property value', () => {
                    expect(a.labels).toEqual(['around']);
                });
            });

            describe('and do invoke the joinpoint', () => {
                beforeEach(() => {
                    aroundAdvice = jasmine
                        .createSpy(
                            'aroundAdvice',
                            (ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                                expect(ctxt.instance).not.toBeNull();
                                return jp().concat(['around']);
                            },
                        )
                        .and.callThrough();
                });

                it('should not get the original property value', () => {
                    expect(a.labels).toEqual(['value', 'around']);
                });
            });

            describe('and do not return a value', () => {
                beforeEach(() => {
                    class AroundPropertyAspect extends Aspect {
                        id = 'APropertyLabel';

                        @Around(on.property.annotations(AProperty))
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
                        class AAspect extends Aspect {
                            id = 'aAspect';

                            @Around(on.property.annotations(AProperty))
                            apply(ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]): any[] {
                                return ['beforeA'].concat(jp() as []).concat('afterA');
                            }
                        }

                        class BAspect extends Aspect {
                            id = 'bAspect';

                            @Around(on.property.annotations(AProperty))
                            apply(ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]): any[] {
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
                        expect(a.labels).toEqual(['beforeB', 'beforeA', 'value', 'afterA', 'afterB']);
                    });
                });
            });
        });
    });
});
