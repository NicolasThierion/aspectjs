import { JoinPoint } from '../../types';
import { AroundContext } from '../advice-context';
import { WeavingError } from '../../weaving-error';
import { Around } from './around.decorator';
import { on } from '../pointcut';
import { AClass, AMethod, AProperty, Labeled, setupWeaver } from '../../../tests/helpers';
import Spy = jasmine.Spy;
import { Aspect } from '../aspect';
import { AnnotationType } from '../../../annotation/annotation.types';

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
            @Aspect('AClassLabel')
            class AroundClassAspect {
                @Around(on.class.withAnnotations(AClass))
                apply(ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                    expect(this).toEqual(jasmine.any(AroundClassAspect));
                    expect(jp).toEqual(ctxt.joinpoint);
                    expect(jpArgs).toEqual(ctxt.args);

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
                        (ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
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
                        (ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
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
                        (ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
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
                        (ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
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

    describe('applied on a property', () => {
        let a: Labeled;
        beforeEach(() => {
            @Aspect('APropertyLabel')
            class AroundPropertyAspect {
                @Around(on.property.withAnnotations(AProperty))
                apply(ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                    expect(this).toEqual(jasmine.any(AroundPropertyAspect));

                    expect(jp).toEqual(ctxt.joinpoint);
                    expect(jpArgs).toEqual(ctxt.args);

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
                            (ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
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
                            (ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                                expect(ctxt.instance).not.toBeNull();
                                return jp().concat(['around']);
                            },
                        )
                        .and.callThrough();
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
                    expect(this).toEqual(jasmine.any(AroundPropertyAspect));

                    expect(jp).toEqual(ctxt.joinpoint);
                    expect(jpArgs).toEqual(ctxt.args);

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
                        .createSpy(
                            'aroundAdvice',
                            (ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                                expect(ctxt.instance).not.toBeNull();
                                return ['around'];
                            },
                        )
                        .and.callThrough();
                });

                it('should not call the original property setter', () => {
                    a.labels = ['newValue'];
                    expect(a.labels).toEqual(['value']);
                });
            });

            describe('and do invoke the joinpoint', () => {
                beforeEach(() => {
                    aroundAdvice = jasmine
                        .createSpy(
                            'aroundAdvice',
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
                        )
                        .and.callThrough();
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
                    expect(this).toEqual(jasmine.any(AroundPropertyAspect));

                    expect(jp).toEqual(ctxt.joinpoint);
                    expect(jpArgs).toEqual(ctxt.args);

                    return aroundAdvice(ctxt, jp, jpArgs);
                }
            }

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
                aroundAdvice = jasmine
                    .createSpy('aroundAdvice', function(ctxt, jp) {
                        return jp();
                    })
                    .and.callThrough();
            });

            describe('calling the method', () => {
                it('should call the aspect', () => {
                    expect(aroundAdvice).not.toHaveBeenCalled();
                    a.addLabel();
                    expect(aroundAdvice).toHaveBeenCalled();
                });

                it('should return the value returned by the advice', () => {
                    aroundAdvice = jasmine
                        .createSpy('aroundAdvice', function(ctxt, jp) {
                            return ['newValue'];
                        })
                        .and.callThrough();
                    expect(a.addLabel()).toEqual(['newValue']);
                });
            });

            describe('and do not invoke the joinpoint', () => {
                beforeEach(() => {
                    aroundAdvice = jasmine
                        .createSpy(
                            'aroundAdvice',
                            (ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {},
                        )
                        .and.callThrough();
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
                        .createSpy(
                            'aroundAdvice',
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
                        )
                        .and.callThrough();
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
        let a: Labeled;
        beforeEach(() => {
            @Aspect()
            class AroundPropertyAspect {
                @Around(on.method.withAnnotations(AMethod))
                apply(ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                    expect(this).toEqual(jasmine.any(AroundPropertyAspect));

                    expect(jp).toEqual(ctxt.joinpoint);
                    expect(jpArgs).toEqual(ctxt.args);

                    return aroundAdvice(ctxt, jp, jpArgs);
                }
            }

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
                aroundAdvice = jasmine
                    .createSpy('aroundAdvice', function(ctxt, jp) {
                        return jp();
                    })
                    .and.callThrough();
            });

            describe('calling the method', () => {
                it('should call the aspect', () => {
                    expect(aroundAdvice).not.toHaveBeenCalled();
                    a.addLabel();
                    expect(aroundAdvice).toHaveBeenCalled();
                });

                it('should return the value returned by the advice', () => {
                    aroundAdvice = jasmine
                        .createSpy('aroundAdvice', function(ctxt, jp) {
                            return ['newValue'];
                        })
                        .and.callThrough();
                    expect(a.addLabel()).toEqual(['newValue']);
                });
            });

            describe('and do not invoke the joinpoint', () => {
                beforeEach(() => {
                    aroundAdvice = jasmine
                        .createSpy(
                            'aroundAdvice',
                            (ctxt: AroundContext<any, AnnotationType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {},
                        )
                        .and.callThrough();
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
                        .createSpy(
                            'aroundAdvice',
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
                        )
                        .and.callThrough();
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
                    expect(a.labels).toEqual(['newValue', 'aroundB', 'aroundA']);
                });
            });
        });
    });
});
