import { AnnotationContext } from '../context/annotation-context';
import { Annotation, AdviceType } from '../annotation.types';
import { AdviceLocation } from '../../advice/target/advice-target';

export interface AnnotationsBundle<T> extends AnnotationContextSelector<T, AdviceType> {
    at<A extends AdviceType>(location: AdviceLocation<T, A>): AnnotationContextSelector<T, A>;
    all<A extends AdviceType>(annotation?: Annotation<A>): readonly AnnotationContext<T, A>[];
    class<A extends AdviceType>(annotation?: Annotation<A>): readonly AnnotationContext<T, A>[];
    properties<A extends AdviceType>(annotation?: Annotation<A>): readonly AnnotationContext<T, A>[];
    methods<A extends AdviceType>(annotation?: Annotation<A>): readonly AnnotationContext<T, A>[];
    parameters<A extends AdviceType>(annotation?: Annotation<A>): readonly AnnotationContext<T, A>[];
}

export interface AnnotationContextSelector<T, A extends AdviceType> {
    all(annotation?: Annotation<A> | string): readonly AnnotationContext<T, A>[];
}
