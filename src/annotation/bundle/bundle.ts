import { AnnotationType } from '../annotation.types';
import { AnnotationLocation } from '../location';
import { AnnotationContext } from '../context/context';

export interface AnnotationsBundle<T> extends AnnotationContextSelector<T, AnnotationType> {
    at<D extends AnnotationType>(location: AnnotationLocation<T, D>): AnnotationContextSelector<T, D>;
    all(decoratorName?: string): AnnotationContext<T, AnnotationType>[];
    class(decoratorName?: string): AnnotationContext<T, AnnotationType>[];
    properties(decoratorName?: string): AnnotationContext<T, AnnotationType>[];
    methods(decoratorName?: string): AnnotationContext<T, AnnotationType>[];
    parameters(decoratorName?: string): AnnotationContext<T, AnnotationType>[];
}

export interface AnnotationContextSelector<T, D extends AnnotationType> {
    all(decoratorName?: string): AnnotationContext<T, D>[];
}
