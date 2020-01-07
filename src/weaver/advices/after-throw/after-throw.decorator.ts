import { AnnotationAdviceFactory } from '../annotation-advice-factory';
import { PointcutExpression, PointcutPhase } from '../pointcut';

export function AfterThrow(pointcut: PointcutExpression): MethodDecorator {
    return AnnotationAdviceFactory.create(pointcut, PointcutPhase.AFTERTHROW);
}
