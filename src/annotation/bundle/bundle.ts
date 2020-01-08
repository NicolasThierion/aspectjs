import { AnnotationContext } from '../context/context';
import { AnnotationLocation } from '../location/location';
import { AdviceType } from '../../weaver/advices/types';

export interface AnnotationsBundle<T> extends AnnotationContextSelector<T, AdviceType> {
    at<D extends AdviceType>(location: AnnotationLocation<T, D>): AnnotationContextSelector<T, D>;
    all(decoratorName?: string): readonly AnnotationContext<T, AdviceType>[];
    class(decoratorName?: string): readonly AnnotationContext<T, AdviceType>[];
    properties(decoratorName?: string): readonly AnnotationContext<T, AdviceType>[];
    methods(decoratorName?: string): readonly AnnotationContext<T, AdviceType>[];
    parameters(decoratorName?: string): readonly AnnotationContext<T, AdviceType>[];
}

export interface AnnotationContextSelector<T, D extends AdviceType> {
    all(decoratorName?: string): readonly AnnotationContext<T, D>[];
}
