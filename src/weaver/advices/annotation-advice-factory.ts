import { Advice } from './types';
import { assert, isFunction } from '../../utils';
import { AdvicesRegistry } from './advice-registry';
import { Pointcut, PointcutExpression, PointcutPhase } from './pointcut';

export class AnnotationAdviceFactory {
    static create(pointcutExp: PointcutExpression, phase: PointcutPhase): MethodDecorator {
        const pointcut = Pointcut.of(phase, pointcutExp);

        return function(aspect: any, propertyKey: string | symbol) {
            assert(isFunction(aspect[propertyKey]));
            const advice = aspect[propertyKey] as Advice;

            advice.pointcut = pointcut;

            Reflect.defineProperty(advice, Symbol.toPrimitive, {
                value: () => `${aspect.constructor.name} {${phase}(${pointcut.annotation}) ${String(propertyKey)}() }`,
            });

            AdvicesRegistry.create(aspect, advice);
        };
    }
}
