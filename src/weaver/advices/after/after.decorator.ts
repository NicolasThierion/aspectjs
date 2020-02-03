import { AdviceFactory } from '../advice-factory';
import { PointcutPhase, PointcutExpression, PointcutOption, Pointcut } from '../pointcut';

export function After(pointcutExp: PointcutExpression, options?: PointcutOption): MethodDecorator {
    return AdviceFactory.create(Pointcut.of(PointcutPhase.AFTER, pointcutExp, options));
}
