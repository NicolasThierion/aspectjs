import { AClass, setupWeaver } from '../../testing/src/helpers';
import { weaverContext } from '../weaver/weaver-context';
import { Aspect } from './aspect';
import { AspectType } from '../weaver/types';
import { Before } from './before/before.decorator';
import { on, Pointcut, PointcutPhase } from './pointcut';
import { After } from './after/after.decorator';

describe('AdvicesRegistry', () => {
    const advicesRegistry = weaverContext.advicesRegistry;
    beforeEach(() => {
        setupWeaver();
    });
    describe('method getAdvicesByAspect()', () => {
        describe('given an object that is not an aspect', () => {
            it('should throw an WeavingError', () => {
                expect(() => advicesRegistry.getAdvicesByAspect({})).toThrow(new TypeError('Object is not an Aspect'));

                expect(() => advicesRegistry.getAdvicesByAspect(new (class A {})())).toThrow(
                    new TypeError('A is not an Aspect'),
                );
            });
        });

        describe('given an aspect instance', () => {
            let aspect: AspectType;

            describe('that defines no advices', () => {
                beforeEach(() => {
                    @Aspect()
                    class AAspect {}
                    aspect = new AAspect();
                });

                it('should return empty array', () => {
                    expect(advicesRegistry.getAdvicesByAspect(aspect)).toEqual([]);
                });
            });

            describe('that defines some advices', () => {
                beforeEach(() => {
                    @Aspect()
                    class AAspect {
                        @Before(on.class.withAnnotations(AClass))
                        beforeAdvice1() {}

                        @After(on.class.withAnnotations(AClass))
                        afterAdvice1() {}
                    }
                    aspect = new AAspect();
                });

                it('should return an array with corresponding advices', () => {
                    const advices = advicesRegistry.getAdvicesByAspect(aspect);
                    expect(advices.length).toEqual(2);
                    expect(advices[0].name).toEqual('beforeAdvice1');
                    expect(advices[0].pointcut.phase).toEqual(PointcutPhase.BEFORE);
                    expect(advices[1].name).toEqual('afterAdvice1');
                    expect(advices[1].pointcut.phase).toEqual(PointcutPhase.AFTER);
                });
            });
        });
    });
});
