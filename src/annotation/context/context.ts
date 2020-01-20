import {
    AdviceTarget,
    ClassAdviceTarget,
    MethodAdviceTarget,
    ParameterAdviceTarget,
    PropertyAdviceTarget,
} from '../target/advice-target';
import { AnnotationRef } from '../annotation.types';
import { AdviceType } from '../../weaver/advices/types';

export interface AnnotationContext<T, D extends AdviceType> extends AnnotationRef {
    readonly args: any[];
    readonly target: AdviceTarget<T, AdviceType>;
}

export interface ClassAnnotationContext<T> extends AnnotationContext<T, AdviceType.CLASS> {
    readonly target: ClassAdviceTarget<T>;
}

export interface MethodAnnotationContext<T> extends AnnotationContext<T, AdviceType.METHOD> {
    readonly target: MethodAdviceTarget<T>;
}

export interface PropertyAnnotationContext<T> extends AnnotationContext<T, AdviceType.PROPERTY> {
    readonly target: PropertyAdviceTarget<T>;
}

export interface ParameterAnnotationContext<T> extends AnnotationContext<T, AdviceType.PARAMETER> {
    readonly target: ParameterAdviceTarget<T>;
}
