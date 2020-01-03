import { Aspect, JoinPoint } from '../../types';
import { Weaver } from '../../load-time/load-time-weaver';
import { ClassAnnotation, setWeaver } from '../../../index';
import { AroundAdvice } from '../types';
import { AClass } from '../../../tests/a';
import { AroundContext } from '../../advice-context';
import Spy = jasmine.Spy;
import { WeavingError } from '../../weaving-error';
import { Around } from './around.decorator';

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

            @Around(AClass)
            apply(ctxt: AroundContext<any, ClassAnnotation>, jp: JoinPoint, jpArgs: any[]): void {
                expect(jp).toEqual(ctxt.joinpoint);
                expect(jpArgs).toEqual(ctxt.joinpointArgs);

                return aroundAdvice(ctxt, jp, jpArgs);
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
                aroundAdvice = (ctxt: AroundContext<any, ClassAnnotation>, jp: JoinPoint, jpArgs: any[]) => {
                    expect(ctxt.instance.get()).not.toBeNull();
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
                aroundAdvice = (ctxt: AroundContext<any, ClassAnnotation>, jp: JoinPoint, jpArgs: any[]) => {
                    jp();
                    ctxt.instance.get().labels.push('a');
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
                aroundAdvice = (ctxt: AroundContext<any, ClassAnnotation>, jp: JoinPoint, jpArgs: any[]) => {
                    jp(['x']);
                    ctxt.instance.get().labels.push('a');
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
                aroundAdvice = (ctxt: AroundContext<any, ClassAnnotation>, jp: JoinPoint, jpArgs: any[]) => {
                    ctxt.instance.get().labels = ctxt.instance.get().labels ?? [];
                    ctxt.instance.get().labels.push('a');
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

                class AAspect extends Aspect {
                    name = 'aAspect';

                    @Around(AClass)
                    apply(ctxt: AroundContext<any, ClassAnnotation>, jp: JoinPoint, jpArgs: any[]): void {
                        labels.push('beforeA');
                        jp(aArgsOverride);
                        labels.push('afterA');
                    }
                }

                class BAspect extends Aspect {
                    name = 'bAspect';

                    @Around(AClass)
                    apply(ctxt: AroundContext<any, ClassAnnotation>, jp: JoinPoint, jpArgs: any[]): void {
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
});