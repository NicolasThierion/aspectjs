import { AnnotationAdviceFactory } from '../annotation-advice-factory';
import { PointcutPhase } from '../../pointcut/pointcut';
import { PointcutExpression } from '../pointcut';

export function Before(pointcutExp: PointcutExpression): MethodDecorator {
    return AnnotationAdviceFactory.create(pointcutExp, PointcutPhase.BEFORE);
}
