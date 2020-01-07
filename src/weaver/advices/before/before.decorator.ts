import { AnnotationAdviceFactory } from '../annotation-advice-factory';
import { PointcutExpression, PointcutPhase } from '../pointcut';

export function Before(pointcutExp: PointcutExpression): MethodDecorator {
    return AnnotationAdviceFactory.create(pointcutExp, PointcutPhase.BEFORE);
}
