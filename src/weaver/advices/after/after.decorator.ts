import { AnnotationAdviceFactory } from '../annotation-advice-factory';
import { PointcutPhase, PointcutExpression } from '../pointcut';

export function After(pointcut: PointcutExpression): MethodDecorator {
    return AnnotationAdviceFactory.create(pointcut, PointcutPhase.AFTER);
}
