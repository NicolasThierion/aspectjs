import { AClass, resetWeaverContext } from '../../testing';
import { getWeaverContext } from '../weaver';
import { After, Aspect, Before } from '../annotations';
import { AspectType } from '../weaver';
import { on, PointcutPhase } from '../advice/pointcut';
import { AspectsRegistry } from './aspect-registry';

describe('AspectsRegistry', () => {
    let aspectsRegistry: AspectsRegistry;
    beforeEach(() => {
        resetWeaverContext();
        aspectsRegistry = getWeaverContext().aspects.registry;
    });
    describe('method getAdvicesByAspect()', () => {
        describe('given an object that is not an aspect', () => {
            it('should throw an WeavingError', () => {
                expect(() => aspectsRegistry.getAdvicesByAspect({})).toThrow(new TypeError('Object is not an Aspect'));

                expect(() => aspectsRegistry.getAdvicesByAspect(new (class A {})())).toThrow(
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

                    resetWeaverContext().getWeaver().enable(aspect);
                    aspectsRegistry = getWeaverContext().aspects.registry;
                });

                it('should return empty array', () => {
                    expect(aspectsRegistry.getAdvicesByAspect(aspect)).toEqual([]);
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
                    resetWeaverContext(aspect);
                    aspectsRegistry = getWeaverContext().aspects.registry;
                });

                it('should return an array with corresponding advices', () => {
                    const advices = aspectsRegistry.getAdvicesByAspect(aspect);
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
