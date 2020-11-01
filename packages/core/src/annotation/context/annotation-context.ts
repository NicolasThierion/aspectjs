import {
    AdviceTarget,
    ClassAdviceTarget,
    MethodAdviceTarget,
    ParameterAdviceTarget,
    PropertyAdviceTarget,
} from '../target/annotation-target';
import { AnnotationRef, AnnotationType } from '../annotation.types';

export abstract class AnnotationContext<T = unknown, A extends AnnotationType = any> extends AnnotationRef {
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
