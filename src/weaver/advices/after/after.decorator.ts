import { AdviceFactory } from '../advice-factory';
import { PointcutPhase, PointcutExpression } from '../pointcut';

export function After(pointcut: PointcutExpression): MethodDecorator {
    return AdviceFactory.create(pointcut, PointcutPhase.AFTER);
}
