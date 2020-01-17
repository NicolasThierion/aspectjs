import { AdviceFactory } from '../advice-factory';
import { PointcutExpression, PointcutPhase } from '../pointcut';

export function Around(pointcutExp: PointcutExpression): MethodDecorator {
    return AdviceFactory.create(pointcutExp, PointcutPhase.AROUND);
}
