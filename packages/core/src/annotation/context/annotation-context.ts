import {
    AdviceTarget,
    ClassAdviceTarget,
    MethodAdviceTarget,
    ParameterAdviceTarget,
    PropertyAdviceTarget,
} from '../../advice/target/advice-target';
import { AnnotationRef, AnnotationType } from '../annotation.types';

export interface AnnotationContext<T, A extends AnnotationType> extends AnnotationRef {
    readonly args: any[];
    readonly target: AdviceTarget<T, A>;
}

export interface ClassAnnotationContext<T> extends AnnotationContext<T, AnnotationType.CLASS> {
    readonly target: ClassAdviceTarget<T>;
}

export interface MethodAnnotationContext<T> extends AnnotationContext<T, AnnotationType.METHOD> {
    readonly target: MethodAdviceTarget<T>;
}

export interface PropertyAnnotationContext<T> extends AnnotationContext<T, AnnotationType.PROPERTY> {
    readonly target: PropertyAdviceTarget<T>;
}

export interface ParameterAnnotationContext<T> extends AnnotationContext<T, AnnotationType.PARAMETER> {
    readonly target: ParameterAdviceTarget<T>;
}
