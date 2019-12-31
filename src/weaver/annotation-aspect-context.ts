import { AnnotationContext } from '../annotation/context/context';
import { AnnotationType } from '..';

export interface AnnotationAspectContext<T, A extends AnnotationType> {
    readonly annotation: AnnotationContext<T, A>;
    readonly instance: T;
}
