import { AdviceFactory } from '../advice-factory';
import { Pointcut, PointcutExpression, PointcutOption, PointcutPhase } from '../pointcut';
import { annotationFactory } from '../../utils/utils';

export const AfterReturn = annotationFactory.create(function AfterReturn(
    pointcutExp: PointcutExpression,
    options?: PointcutOption,
): MethodDecorator {
    return AdviceFactory.create(Pointcut.of(PointcutPhase.AFTERRETURN, pointcutExp, options));
});
