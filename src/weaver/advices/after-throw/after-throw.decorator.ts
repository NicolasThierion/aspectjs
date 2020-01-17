import { AdviceFactory } from '../advice-factory';
import { PointcutExpression, PointcutPhase } from '../pointcut';

export function AfterThrow(pointcut: PointcutExpression): MethodDecorator {
    return AdviceFactory.create(pointcut, PointcutPhase.AFTERTHROW);
}
