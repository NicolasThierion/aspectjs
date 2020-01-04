import {
    AnnotationTarget,
    ClassAnnotationTarget,
    MethodAnnotationTarget,
    PropertyAnnotationTarget,
} from '../target/annotation-target';
import {
    AnnotationRef,
    Annotation,
    ClassAnnotation,
    MethodAnnotation,
    ParameterAnnotation,
    PropertyAnnotation,
} from '../annotation.types';

export interface AnnotationContext<T, D extends Annotation> extends AnnotationRef {
    readonly args: any[];
    readonly target: AnnotationTarget<T, D>;
}

export interface ClassAnnotationContext<T> extends AnnotationContext<T, ClassAnnotation> {
    readonly target: ClassAnnotationTarget<T>;
}

export interface MethodAnnotationContext<T> extends AnnotationContext<T, MethodAnnotation> {
    readonly target: MethodAnnotationTarget<T>;
}

export interface PropertyAnnotationContext<T> extends AnnotationContext<T, PropertyAnnotation> {
    readonly target: PropertyAnnotationTarget<T>;
}

export interface ParameterAnnotationContext<T> extends AnnotationContext<T, ParameterAnnotation> {
    readonly target: AnnotationTarget<T, ParameterAnnotation>;
}
