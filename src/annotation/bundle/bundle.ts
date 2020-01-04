import { Annotation } from '../annotation.types';
import { AnnotationContext } from '../context/context';
import { AnnotationLocation } from '../location/location';

export interface AnnotationsBundle<T> extends AnnotationContextSelector<T, Annotation> {
    at<D extends Annotation>(location: AnnotationLocation<T, D>): AnnotationContextSelector<T, D>;
    all(decoratorName?: string): readonly AnnotationContext<T, Annotation>[];
    class(decoratorName?: string): readonly AnnotationContext<T, Annotation>[];
    properties(decoratorName?: string): readonly AnnotationContext<T, Annotation>[];
    methods(decoratorName?: string): readonly AnnotationContext<T, Annotation>[];
    parameters(decoratorName?: string): readonly AnnotationContext<T, Annotation>[];
}

export interface AnnotationContextSelector<T, D extends Annotation> {
    all(decoratorName?: string): readonly AnnotationContext<T, D>[];
}
