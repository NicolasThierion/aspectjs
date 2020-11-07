import { AdviceFactory } from '../advice-factory';
import { Pointcut, PointcutExpression, PointcutPhase } from '../pointcut';
import { ASPECTJS_ANNOTATION_FACTORY } from '../../utils/utils';

export const AfterThrow = ASPECTJS_ANNOTATION_FACTORY.create(function AfterThrow(
    pointcutExp: PointcutExpression,
): MethodDecorator {
    return AdviceFactory.create(Pointcut.of(PointcutPhase.AFTERTHROW, pointcutExp));
});
