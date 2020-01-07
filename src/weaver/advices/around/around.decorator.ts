import { AnnotationAdviceFactory } from '../annotation-advice-factory';
import { PointcutExpression, PointcutPhase } from '../pointcut';

export function Around(pointcutExp: PointcutExpression): MethodDecorator {
    return AnnotationAdviceFactory.create(pointcutExp, PointcutPhase.AROUND);
}
