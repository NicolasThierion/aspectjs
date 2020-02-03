import { AdviceFactory } from '../advice-factory';
import { Pointcut, PointcutExpression, PointcutOption, PointcutPhase } from '../pointcut';

export function Before(pointcutExp: PointcutExpression, options?: PointcutOption): MethodDecorator {
    return AdviceFactory.create(Pointcut.of(PointcutPhase.BEFORE, pointcutExp, options));
}
