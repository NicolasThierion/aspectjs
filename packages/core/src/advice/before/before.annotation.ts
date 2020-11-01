import { AdviceFactory } from '../advice-factory';
import { Pointcut, PointcutExpression, PointcutOption, PointcutPhase } from '../pointcut';
import { annotationFactory } from '../../utils/utils';

export const Before = annotationFactory.create(function Before(
    pointcutExp: PointcutExpression,
    options?: PointcutOption,
): MethodDecorator {
    return AdviceFactory.create(Pointcut.of(PointcutPhase.BEFORE, pointcutExp, options));
});
