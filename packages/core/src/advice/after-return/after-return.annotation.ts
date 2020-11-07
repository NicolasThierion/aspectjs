import { AdviceFactory } from '../advice-factory';
import { Pointcut, PointcutExpression, PointcutPhase } from '../pointcut';
import { ASPECTJS_ANNOTATION_FACTORY } from '../../utils/utils';

export const AfterReturn = ASPECTJS_ANNOTATION_FACTORY.create(function AfterReturn(
    pointcutExp: PointcutExpression,
): MethodDecorator {
    return AdviceFactory.create(Pointcut.of(PointcutPhase.AFTERRETURN, pointcutExp));
});
