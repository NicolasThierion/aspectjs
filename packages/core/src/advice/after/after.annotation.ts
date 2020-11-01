import { AdviceFactory } from '../advice-factory';
import { PointcutPhase, PointcutExpression, PointcutOption, Pointcut } from '../pointcut';
import { annotationFactory } from '../../utils/utils';

export const After = annotationFactory.create(function After(
    pointcutExp: PointcutExpression,
    options?: PointcutOption,
): MethodDecorator {
    return AdviceFactory.create(Pointcut.of(PointcutPhase.AFTER, pointcutExp, options));
});
