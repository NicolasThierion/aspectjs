import { AdviceFactory } from '../advice-factory';
import { PointcutExpression, PointcutPhase } from '../pointcut';

export function Before(pointcutExp: PointcutExpression): MethodDecorator {
    return AdviceFactory.create(pointcutExp, PointcutPhase.BEFORE);
}
