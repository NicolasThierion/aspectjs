import { AnnotationContext } from '../context/context';
import { AnnotationLocation } from '../location/location';
import { AnnotationType } from '../annotation.types';

export interface AnnotationsBundle<T> extends AnnotationContextSelector<T, AnnotationType> {
    at<D extends AnnotationType>(location: AnnotationLocation<T, D>): AnnotationContextSelector<T, D>;
    all(annotationName?: string): readonly AnnotationContext<T, AnnotationType>[];
    class(annotationName?: string): readonly AnnotationContext<T, AnnotationType>[];
    properties(annotationName?: string): readonly AnnotationContext<T, AnnotationType>[];
    methods(annotationName?: string): readonly AnnotationContext<T, AnnotationType>[];
    parameters(annotationName?: string): readonly AnnotationContext<T, AnnotationType>[];
}

export interface AnnotationContextSelector<T, D extends AnnotationType> {
    all(annotationName?: string): readonly AnnotationContext<T, D>[];
}
