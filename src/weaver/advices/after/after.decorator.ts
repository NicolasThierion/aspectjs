import { AnnotationAdviceFactory } from '../annotation-advice-factory';
import { PointcutExpression } from '../pointcut';
import { PointcutPhase } from '../../pointcut/pointcut';

export function After(pointcut: PointcutExpression): MethodDecorator {
    return AnnotationAdviceFactory.create(pointcut, PointcutPhase.AFTER);
}
