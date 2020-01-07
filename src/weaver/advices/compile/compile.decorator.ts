import { AnnotationAdviceFactory } from '../annotation-advice-factory';
import { PointcutPhase } from '../../pointcut/pointcut';
import { PointcutExpression } from '../pointcut';

export function Compile(pointcutExp: PointcutExpression): MethodDecorator {
    return AnnotationAdviceFactory.create(pointcutExp, PointcutPhase.COMPILE);
}
