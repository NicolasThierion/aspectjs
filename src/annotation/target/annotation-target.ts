import {
    AnnotationLocation,
    ClassAnnotationLocation,
    MethodAnnotationLocation,
    ParameterAnnotationLocation,
    PropertyAnnotationLocation,
} from '../location/location';
import { AdviceType } from '../../weaver/advices/types';

export interface AnnotationTarget<T, A extends AdviceType> {
    readonly location: AnnotationLocation<T, A>;
    readonly type: A;
    readonly proto: any;
    readonly name: string;
    readonly label: string;
    readonly ref: string;

    readonly propertyKey: A extends AdviceType.PROPERTY | AdviceType.METHOD | AdviceType.PARAMETER ? string : never;
    readonly descriptor: A extends AdviceType.METHOD ? TypedPropertyDescriptor<T> : never;
    readonly parameterIndex: A extends AdviceType.PARAMETER ? number : never;
    readonly parent: A extends AdviceType.METHOD
        ? AnnotationTarget<any, AdviceType.CLASS>
        : A extends AdviceType.PROPERTY
        ? AnnotationTarget<any, AdviceType.CLASS>
        : A extends AdviceType.PARAMETER
        ? AnnotationTarget<any, AdviceType.METHOD>
        : ClassAnnotationTarget<any>;
    readonly declaringClass: ClassAnnotationTarget<T>;
    readonly parentClass: ClassAnnotationTarget<T>;
}

export interface ClassAnnotationTarget<T> extends AnnotationTarget<T, AdviceType.CLASS> {
    readonly location: ClassAnnotationLocation<T>;
    readonly parent: ClassAnnotationTarget<any>;
}

export interface PropertyAnnotationTarget<T> extends AnnotationTarget<T, AdviceType.PROPERTY> {
    readonly propertyKey: string;
    readonly location: PropertyAnnotationLocation<T>;
    readonly parent: ClassAnnotationTarget<T>;
}

export interface MethodAnnotationTarget<T> extends AnnotationTarget<T, AdviceType.METHOD> {
    readonly descriptor: TypedPropertyDescriptor<T>;
    readonly location: MethodAnnotationLocation<T>;
    readonly parent: ClassAnnotationTarget<T>;
}

export interface ParameterAnnotationTarget<T> extends AnnotationTarget<T, AdviceType.PARAMETER> {
    readonly propertyKey: string;
    readonly parameterIndex: number;
    readonly location: ParameterAnnotationLocation<T>;
    readonly parent: MethodAnnotationTarget<T>;
}
