import { AdviceFactory } from '../advice-factory';
import { PointcutExpression, PointcutPhase } from '../pointcut';

export function Compile(pointcutExp: PointcutExpression): MethodDecorator {
    return AdviceFactory.create(pointcutExp, PointcutPhase.COMPILE);
}
