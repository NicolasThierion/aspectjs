import { AnnotationAdviceFactory } from '../annotation-advice-factory';
import { PointcutExpression, PointcutPhase } from '../pointcut';

export function AfterReturn(pointcutExp: PointcutExpression): MethodDecorator {
    return AnnotationAdviceFactory.create(pointcutExp, PointcutPhase.AFTERRETURN);
}
