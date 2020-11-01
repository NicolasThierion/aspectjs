import { AdviceFactory } from '../advice-factory';
import { PointcutPhase, PointcutExpression, PointcutOption, Pointcut } from '../pointcut';
import { ASPECTJS_ANNOTATION_FACTORY } from '../../utils/utils';

export const After = ASPECTJS_ANNOTATION_FACTORY.create(function After(
    pointcutExp: PointcutExpression,
    options?: PointcutOption,
): MethodDecorator {
    return AdviceFactory.create(Pointcut.of(PointcutPhase.AFTER, pointcutExp, options));
});
