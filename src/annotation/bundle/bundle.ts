import { AnnotationContext } from '../context/context';
import { AdviceLocation } from '../location/location';
import { AdviceType } from '../../weaver/advices/types';

export interface AnnotationsBundle<T> extends AnnotationContextSelector<T, AdviceType> {
    at<D extends AdviceType>(location: AdviceLocation<T, D>): AnnotationContextSelector<T, D>;
    all(annotationName?: string): readonly AnnotationContext<T, AdviceType>[];
    class(annotationName?: string): readonly AnnotationContext<T, AdviceType>[];
    properties(annotationName?: string): readonly AnnotationContext<T, AdviceType>[];
    methods(annotationName?: string): readonly AnnotationContext<T, AdviceType>[];
    parameters(annotationName?: string): readonly AnnotationContext<T, AdviceType>[];
}

export interface AnnotationContextSelector<T, D extends AdviceType> {
    all(annotationName?: string): readonly AnnotationContext<T, D>[];
}
