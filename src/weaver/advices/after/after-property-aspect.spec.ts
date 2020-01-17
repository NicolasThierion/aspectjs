import { Aspect } from '../../types';
import { AdviceType, AfterAdvice } from '../types';
import { setWeaver } from '../../../index';
import { After } from './after.decorator';
import { AdviceContext, AfterContext } from '../advice-context';
import { LoadTimeWeaver } from '../../load-time/load-time-weaver';
import { AnnotationFactory } from '../../../annotation/factory/factory';
import { pc } from '../pointcut';
import { WeavingError } from '../../weaving-error';

const AProperty = new AnnotationFactory('tests').create(function AProperty(): PropertyDecorator {
    return;
});

interface Labeled {
    labels?: string[];
}

function setupWeaver(...aspects: Aspect[]): void {
    const weaver = new LoadTimeWeaver().enable(...aspects);
    setWeaver(weaver);
    weaver.load();
}

let afterAdvice: AfterAdvice<any> = ctxt => {
    throw new Error('should configure afterThrowAdvice');
};

describe('given a property getter annotated with an aspect', () => {
    describe('that leverage "after" pointcut', () => {
        beforeEach(() => {
            class AfterAspect extends Aspect {
                id = 'APropertyLabel';

                @After(pc.property.annotations(AProperty))
                apply(ctxt: AdviceContext<any, AdviceType.PROPERTY>): void {
                    expect(this).toEqual(jasmine.any(AfterAspect));

                    afterAdvice(ctxt);
                }
            }

            afterAdvice = jasmine
                .createSpy('afterAdvice', function(ctxt: AfterContext<any, AdviceType.PROPERTY>) {})
                .and.callThrough();

            setupWeaver(new AfterAspect());
        });

        describe('getting the annotated property', () => {
            it('should invoke the aspect', () => {
                class A implements Labeled {
                    @AProperty()
                    labels?: string[];
                }

                const instance = new A() as Labeled;
                const labels = instance.labels;

                expect(afterAdvice).toHaveBeenCalled();
            });

            it("should return the original property's value", () => {
                class A implements Labeled {
                    @AProperty()
                    labels = ['a'];
                }

                const instance = new A() as Labeled;
                const labels = instance.labels;

                expect(labels).toEqual(['a']);
            });
        });

        describe('when the advice returns a value', () => {
            it('should throw an error', () => {
                class BadAfterAspect extends Aspect {
                    id = 'APropertyLabel';

                    @After(pc.property.annotations(AProperty))
                    apply(ctxt: AdviceContext<any, AdviceType.PROPERTY>) {
                        return Object.getOwnPropertyDescriptor({ test: 'test' }, 'test');
                    }
                }

                setupWeaver(new BadAfterAspect());
                expect(() => {
                    class X {
                        @AProperty()
                        someProp: string;
                    }

                    const prop = new X().someProp;
                }).toThrow(
                    new WeavingError(
                        'Returning from advice "@After(@AProperty) BadAfterAspect.apply()" is not supported',
                    ),
                );
            });
        });
    });
});
