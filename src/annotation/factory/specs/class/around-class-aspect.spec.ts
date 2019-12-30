import { AroundAdvice, Aspect, AspectHooks } from '../../../../weaver/types';
import { AClass } from '../../../../tests/a';
import { WeavingError } from '../../../../weaver/weaving-error';
import { Weaver } from '../../../../weaver/load-time/load-time-weaver';
import { setWeaver } from '../../../../index';
import Spy = jasmine.Spy;
import { ClassAnnotationContext } from '../../../context/context';

function setupWeaver(...aspects: Aspect[]) {
    const weaver = new Weaver().enable(...aspects);
    setWeaver(weaver);
    weaver.load();
}

let aroundAdvice: AroundAdvice<any> = (ctxt, jp, jpArgs) => {
    throw new Error('should configure aroundAdvice');
};
describe('given a class configured with some class-annotation aspect', () => {
    beforeEach(() => {
        class AroundClassAspect extends Aspect {
            name = 'AClassLabel';

            apply(hooks: AspectHooks): void {
                hooks.annotations(AClass).class.around((ctxt, jp, jpArgs) => aroundAdvice(ctxt, jp, jpArgs));
            }
        }

        setupWeaver(new AroundClassAspect());
    });
    describe('that leverage "around" pointcut', () => {
        let beforeAdvice: Spy;
        let ctor: Spy;
        let afterAdvice: Spy;

        beforeEach(() => {
            beforeAdvice = jasmine.createSpy('beforeAdvice');
            ctor = jasmine.createSpy('ctor');
            afterAdvice = jasmine.createSpy('afterAdvice');

            aroundAdvice = (ctxt, jp) => {
                beforeAdvice();
                jp();
                afterAdvice();
            };
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

        describe('and references "this" from before the joinpoint', () => {
            beforeEach(() => {
                aroundAdvice = (ctxt, jp) => {
                    console.log(ctxt.instance);
                    jp();
                };
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
                    new WeavingError('Cannot get "this" instance of constructor before joinpoint has been called'),
                );
            });
        });

        describe('and references "this" from after the joinpoint', () => {
            beforeEach(() => {
                aroundAdvice = (ctxt, jp) => {
                    jp();
                    ctxt.instance.labels.push('a');
                };
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

        describe('and calls the joinpoint', () => {
            beforeEach(() => {
                aroundAdvice = (ctxt, jp) => {
                    jp(['x']);
                    ctxt.instance.labels.push('a');
                };
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
                aroundAdvice = (ctxt, jp) => {
                    ctxt.instance.labels = ctxt.instance.labels ?? [];
                    ctxt.instance.labels.push('a');
                };
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
                setupWeaver(
                    new (class extends Aspect {
                        name = 'aAspect';
                        apply(hooks: AspectHooks): void {
                            hooks.annotations(AClass).class.around((ctxt: ClassAnnotationContext<any>, jp) => {
                                labels.push('beforeA');
                                jp(aArgsOverride);
                                labels.push('afterA');
                            });
                        }
                    })(),
                    new (class extends Aspect {
                        name = 'bAspect';
                        apply(hooks: AspectHooks): void {
                            hooks.annotations(AClass).class.around((ctxt: ClassAnnotationContext<any>, jp) => {
                                labels.push('beforeB');
                                jp(bArgsOverride);
                                labels.push('afterB');
                            });
                        }
                    })(),
                );
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
});
