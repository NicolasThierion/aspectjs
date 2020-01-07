import { AnnotationAdviceFactory } from '../annotation-advice-factory';
import { PointcutPhase } from '../../pointcut/pointcut';
import { PointcutExpression } from '../pointcut';

export function AfterThrow(pointcut: PointcutExpression): MethodDecorator {
    return AnnotationAdviceFactory.create(pointcut, PointcutPhase.AFTERTHROW);
}
