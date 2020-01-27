import {
    AnnotationLocation,
    ClassAnnotationLocation,
    MethodAnnotationLocation,
    ParameterAnnotationLocation,
    PropertyAnnotationLocation,
} from '../location/location';
import { AnnotationType } from '../annotation.types';

export interface AnnotationTarget<T, A extends AnnotationType> {
    readonly location: AnnotationLocation<T, A>;
    readonly type: A;
    readonly proto: any;
    readonly name: string;
    readonly label: string;
    readonly ref: string;

    readonly propertyKey: A extends AnnotationType.PROPERTY | AnnotationType.METHOD | AnnotationType.PARAMETER
        ? string
        : never;
    readonly descriptor: A extends AnnotationType.METHOD ? TypedPropertyDescriptor<T> : never;
    readonly parameterIndex: A extends AnnotationType.PARAMETER ? number : never;
    readonly parent: A extends AnnotationType.METHOD
        ? AnnotationTarget<any, AnnotationType.CLASS>
        : A extends AnnotationType.PROPERTY
        ? AnnotationTarget<any, AnnotationType.CLASS>
        : A extends AnnotationType.PARAMETER
        ? AnnotationTarget<any, AnnotationType.METHOD>
        : ClassAdviceTarget<any>;
    readonly declaringClass: ClassAdviceTarget<T>;
    readonly parentClass: ClassAdviceTarget<T>;
}

export interface ClassAdviceTarget<T> extends AnnotationTarget<T, AnnotationType.CLASS> {
    readonly location: ClassAnnotationLocation<T>;
    readonly parent: ClassAdviceTarget<any>;
}

export interface PropertyAdviceTarget<T> extends AnnotationTarget<T, AnnotationType.PROPERTY> {
    readonly propertyKey: string;
    readonly location: PropertyAnnotationLocation<T>;
    readonly parent: ClassAdviceTarget<T>;
}

export interface MethodAdviceTarget<T> extends AnnotationTarget<T, AnnotationType.METHOD> {
    readonly descriptor: TypedPropertyDescriptor<T>;
    readonly location: MethodAnnotationLocation<T>;
    readonly parent: ClassAdviceTarget<T>;
}

export interface ParameterAdviceTarget<T> extends AnnotationTarget<T, AnnotationType.PARAMETER> {
    readonly propertyKey: string;
    readonly parameterIndex: number;
    readonly location: ParameterAnnotationLocation<T>;
    readonly parent: MethodAdviceTarget<T>;
}
