import {
    AnnotationTarget,
    ClassAnnotationTarget,
    MethodAnnotationTarget,
    ParameterAnnotationTarget,
    PropertyAnnotationTarget,
} from '../target/annotation-target';
import { AnnotationRef } from '../annotation.types';
import { AdviceType } from '../../weaver/advices/types';

export interface AnnotationContext<T, D extends AdviceType> extends AnnotationRef {
    readonly args: any[];
    readonly target: AnnotationTarget<T, AdviceType>;
}

export interface ClassAnnotationContext<T> extends AnnotationContext<T, AdviceType.CLASS> {
    readonly target: ClassAnnotationTarget<T>;
}

export interface MethodAnnotationContext<T> extends AnnotationContext<T, AdviceType.METHOD> {
    readonly target: MethodAnnotationTarget<T>;
}

export interface PropertyAnnotationContext<T> extends AnnotationContext<T, AdviceType.PROPERTY> {
    readonly target: PropertyAnnotationTarget<T>;
}

export interface ParameterAnnotationContext<T> extends AnnotationContext<T, AdviceType.PARAMETER> {
    readonly target: ParameterAnnotationTarget<T>;
}
