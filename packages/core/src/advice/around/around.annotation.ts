import { AdviceFactory } from '../advice-factory';
import { Pointcut, PointcutExpression, PointcutOption, PointcutPhase } from '../pointcut';
import { annotationFactory } from '../../utils/utils';

export const Around = annotationFactory.create(function Around(
    pointcutExp: PointcutExpression,
    options?: PointcutOption,
): MethodDecorator {
    return AdviceFactory.create(Pointcut.of(PointcutPhase.AROUND, pointcutExp, options));
});
