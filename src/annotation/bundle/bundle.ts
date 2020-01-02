import { AnnotationType } from '../annotation.types';
import { AnnotationContext } from '../context/context';
import { AnnotationLocation } from '../location/location';

export interface AnnotationsBundle<T> extends AnnotationContextSelector<T, AnnotationType> {
    at<D extends AnnotationType>(location: AnnotationLocation<T, D>): AnnotationContextSelector<T, D>;
    all(decoratorName?: string): readonly AnnotationContext<T, AnnotationType>[];
    class(decoratorName?: string): readonly AnnotationContext<T, AnnotationType>[];
    properties(decoratorName?: string): readonly AnnotationContext<T, AnnotationType>[];
    methods(decoratorName?: string): readonly AnnotationContext<T, AnnotationType>[];
    parameters(decoratorName?: string): readonly AnnotationContext<T, AnnotationType>[];
}

export interface AnnotationContextSelector<T, D extends AnnotationType> {
    all(decoratorName?: string): readonly AnnotationContext<T, D>[];
}
