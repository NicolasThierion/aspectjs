import { PointcutName } from '../types';
import { ClassAnnotation } from '../../../annotation/annotation.types';
import { AnnotationAdviceFactory } from '../annotation-advice-factory';

export function Compile(annotation: ClassAnnotation): MethodDecorator {
    return AnnotationAdviceFactory.create(annotation, PointcutName.COMPILE);
}
