import { Advice, AdviceType } from './types';
import { assert, isFunction } from '../../utils';
import { AdvicesRegistry } from './advice-registry';
import { Pointcut, PointcutExpression, PointcutPhase } from './pointcut';
import { WeavingError } from '../weaving-error';

export class AdviceFactory {
    static create(pointcutExp: PointcutExpression, phase: PointcutPhase): MethodDecorator {
        const pointcut = Pointcut.of(phase, pointcutExp);
        assert(
            !(phase == PointcutPhase.COMPILE && pointcut.type === AdviceType.PROPERTY) ||
                pointcut.name.startsWith('get ') ||
                pointcut.name.startsWith('set '),
        );

        return function(aspect: any, propertyKey: string | symbol) {
            assert(isFunction(aspect[propertyKey]));

            const advice = aspect[propertyKey] as Advice;
            advice.pointcut = pointcut;

            Reflect.defineProperty(advice, Symbol.toPrimitive, {
                value: () => `@${phase}(${pointcut.annotation}) ${aspect.constructor.name}.${String(propertyKey)}()`,
            });

            if (pointcut.name.startsWith('set ')) {
                throw new WeavingError(`Advice "${advice}" cannot be applied on property setter`);
            }

            AdvicesRegistry.create(aspect, advice);
        };
    }
}
