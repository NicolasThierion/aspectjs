import { AdviceFactory } from '../advice-factory';
import { Pointcut, PointcutExpression, PointcutOption, PointcutPhase } from '../pointcut';

export function Compile(pointcutExp: PointcutExpression, options?: PointcutOption): MethodDecorator {
    return AdviceFactory.create(Pointcut.of(PointcutPhase.COMPILE, pointcutExp, options));
}
