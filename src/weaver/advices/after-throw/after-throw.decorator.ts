import { AdviceFactory } from '../advice-factory';
import { Pointcut, PointcutExpression, PointcutOption, PointcutPhase } from '../pointcut';

export function AfterThrow(pointcutExp: PointcutExpression, options?: PointcutOption): MethodDecorator {
    return AdviceFactory.create(Pointcut.of(PointcutPhase.AFTERTHROW, pointcutExp, options));
}
