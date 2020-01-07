import { AnnotationAdviceFactory } from '../annotation-advice-factory';
import { PointcutExpression, PointcutPhase } from '../pointcut';

export function Compile(pointcutExp: PointcutExpression): MethodDecorator {
    return AnnotationAdviceFactory.create(pointcutExp, PointcutPhase.COMPILE);
}
