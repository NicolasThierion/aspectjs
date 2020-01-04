import { PointcutName } from '../types';
import { ClassAnnotation } from '../../../annotation/annotation.types';
import { AnnotationAdviceFactory } from '../annotation-advice-factory';

export function Around(annotation: ClassAnnotation): MethodDecorator {
    return AnnotationAdviceFactory.create(annotation, PointcutName.AROUND);
}
