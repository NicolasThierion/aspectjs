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
describe('given a property configured with some annotation aspect', () => {
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

        class A implements Labeled {
            @AProperty()
            public labels: string[] = ['value'];
        }

        a = new A();
    });
    describe('that leverage "around" pointcut', () => {
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
                aroundAdvice = (ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                    expect(ctxt.instance).not.toBeNull();
                    return ['around'];
                };
            });

            it('should not get the original property value', () => {
                expect(a.labels).toEqual(['around']);
            });
        });

        describe('and do invoke the joinpoint', () => {
            beforeEach(() => {
                aroundAdvice = (ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]) => {
                    expect(ctxt.instance).not.toBeNull();
                    return jp().concat(['around']);
                };
            });

            it('should not get the original property value', () => {
                expect(a.labels).toEqual(['value', 'around']);
            });
        });

        describe('and do not return a value', () => {
            beforeEach(() => {
                class AroundPropertyAspect extends Aspect {
                    id = 'APropertyLabel';

                    @Around(pc.property.annotations(AProperty))
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
    });
    describe('when multiple "around" advices are configured', () => {
        describe('and joinpoint has been called', () => {
            beforeEach(() => {
                class AAspect extends Aspect {
                    id = 'aAspect';

                    @Around(pc.property.annotations(AProperty))
                    apply(ctxt: AroundContext<any, AdviceType.CLASS>, jp: JoinPoint, jpArgs: any[]): any[] {
                        return ['beforeA'].concat(jp() as []).concat('afterA');
                    }
                }

                class BAspect extends Aspect {
                    id = 'bAspect';

                    @Around(pc.property.annotations(AProperty))
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
