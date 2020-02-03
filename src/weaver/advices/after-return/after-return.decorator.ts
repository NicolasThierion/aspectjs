import { AdviceFactory } from '../advice-factory';
import { Pointcut, PointcutExpression, PointcutOption, PointcutPhase } from '../pointcut';

export function AfterReturn(pointcutExp: PointcutExpression, options?: PointcutOption): MethodDecorator {
    return AdviceFactory.create(Pointcut.of(PointcutPhase.AFTERRETURN, pointcutExp, options));
}
