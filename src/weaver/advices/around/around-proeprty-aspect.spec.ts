import { Aspect, JoinPoint } from '../../types';
import { setWeaver } from '../../../index';
import { AdviceType, AroundAdvice } from '../types';
import { AClass } from '../../../tests/a';
import { AroundContext } from '../advice-context';
import { WeavingError } from '../../weaving-error';
import { Around } from './around.decorator';
import { LoadTimeWeaver } from '../../load-time/load-time-weaver';
import { pc } from '../pointcut';
import { AnnotationFactory } from '../../../annotation/factory/factory';
import Spy = jasmine.Spy;

function setupWeaver(...aspects: Aspect[]) {
    const weaver = new LoadTimeWeaver().enable(...aspects);
    setWeaver(weaver);
    weaver.load();
}

interface Labeled {
    labels?: string[];
}

const AProperty = new AnnotationFactory('tests').create(function AProperty(): PropertyDecorator {
    return;
});

let a: Labeled;
let aroundAdvice: AroundAdvice<any> = (ctxt, jp, jpArgs) => {
    throw new Error('should configure aroundAdvice');
};
xdescribe('given a property configured with some annotation aspect', () => {
    beforeEach(() => {
        class AroundPropertyAspect extends Aspect {
            id = 'APropertyLabel';

            @Around(pc.property.annotations(AProperty))
            apply(ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                expect(this).toEqual(jasmine.any(AroundPropertyAspect));

                expect(jp).toEqual(ctxt.joinpoint);
                expect(jpArgs).toEqual(ctxt.joinpointArgs);

                return aroundAdvice(ctxt, jp, jpArgs);
            }
        }

        setupWeaver(new AroundPropertyAspect());
    });
    describe('that leverage "around" pointcut', () => {
        let beforeAdvice: Spy;
        let afterAdvice: Spy;

        beforeEach(() => {
            aroundAdvice = jasmine
                .createSpy('aroundAdvice', function(ctxt, jp) {
                    return jp();
                })
                .and.callThrough();
        });

        it('should call the aspect around the property', () => {
            class A implements Labeled {
                @AProperty()
                public labels: string[] = [];
            }

            const a = new A();
            console.log(a.labels);
            expect(aroundAdvice).toHaveBeenCalled();
        });

        describe('and references "this" from before the joinpoint', () => {
            beforeEach(() => {
                aroundAdvice = (ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                    expect(ctxt.instance).not.toBeNull();
                    jp();
                };
            });

            xit('should throw', () => {
                expect(() => {}).toThrow(
                    new WeavingError(
                        'In advice "@Around(@AClass) AroundClassAspect.apply()": Cannot get "this" instance of constructor before calling constructor joinpoint',
                    ),
                );
            });
        });

        describe('and references "this" from after the joinpoint', () => {
            beforeEach(() => {
                aroundAdvice = (ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                    jp();
                    ctxt.instance.labels.push('a');
                };
            });

            xit('should not throw', () => {
                expect(() => {}).not.toThrow();

                expect(a.labels).toEqual(['ctor', 'a']);
            });
        });

        describe('and calls the joinpoint', () => {
            beforeEach(() => {
                aroundAdvice = (ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                    jp(['x']);
                    ctxt.instance.labels.push('a');
                };
            });

            xit('should call the original ctor with given args', () => {
                expect(a.labels).toEqual(['x', 'a']);
            });
        });

        describe('and do not call the joinpoint', () => {
            beforeEach(() => {
                aroundAdvice = (ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                    ctxt.instance.labels = ctxt.instance.labels ?? [];
                    ctxt.instance.labels.push('a');
                };
            });

            xit('should not call through original ctor', () => {});
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

                    @Around(pc.class.annotations(AClass))
                    apply(ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                        labels.push('beforeA');
                        jp(aArgsOverride);
                        labels.push('afterA');
                    }
                }

                class BAspect extends Aspect {
                    id = 'bAspect';

                    @Around(pc.class.annotations(AClass))
                    apply(ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]): void {
                        labels.push('beforeB');
                        jp(bArgsOverride);
                        labels.push('afterB');
                    }
                }
                setupWeaver(new AAspect(), new BAspect());
            });
            xit('should call them nested, in declaration order', () => {
                expect(a.labels).toEqual(['beforeB', 'beforeA', 'ctor', 'afterA', 'afterB']);
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
