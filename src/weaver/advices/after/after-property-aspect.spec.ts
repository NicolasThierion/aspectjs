import { Aspect } from '../../types';
import { AfterAdvice } from '../types';
import { PropertyAnnotation, setWeaver } from '../../../index';
import { After } from './after.decorator';
import { AdviceContext, AfterContext } from '../advice-context';
import { LoadTimeWeaver } from '../../load-time/load-time-weaver';
import { AnnotationFactory } from '../../../annotation/factory/factory';
import { pc } from '../pointcut';

export const AProperty = new AnnotationFactory('tests').create(function AClass(): PropertyDecorator {
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

xdescribe('given a property getter annotated with an aspect', () => {
    describe('that leverage "after" pointcut', () => {
        beforeEach(() => {
            class AfterAspect extends Aspect {
                name = 'APropertyLabel';

                @After(pc.property.getter.annotations(AProperty))
                apply(ctxt: AdviceContext<any, PropertyAnnotation>): void {
                    afterAdvice(ctxt);
                }
            }

            afterAdvice = jasmine
                .createSpy('afterAdvice', function(ctxt: AfterContext<any, PropertyAnnotation>) {
                    ctxt.instance.labels = ctxt.instance.labels ?? [];
                    ctxt.instance.labels.push('AProperty');
                })
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
    });
});
