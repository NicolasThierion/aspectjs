import { AdviceFactory } from '../advice-factory';
import { Pointcut, PointcutExpression, PointcutPhase } from '../pointcut';
import { ASPECTJS_ANNOTATION_FACTORY } from '../../utils/utils';

export const Before = ASPECTJS_ANNOTATION_FACTORY.create(function Before(
    pointcutExp: PointcutExpression,
): MethodDecorator {
    return AdviceFactory.create(Pointcut.of(PointcutPhase.BEFORE, pointcutExp));
});
