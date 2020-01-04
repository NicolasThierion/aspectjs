import { ClassAnnotation, MethodAnnotation, ParameterAnnotation, PropertyAnnotation } from '../annotation.types';
import { Annotation } from '../annotation.types';
import {
    AnnotationLocation,
    ClassAnnotationLocation,
    MethodAnnotationLocation,
    ParameterAnnotationLocation,
    PropertyAnnotationLocation,
} from '../location/location';

export enum AnnotationTargetType {
    CLASS = 0,
    PROPERTY = 1,
    METHOD = 2,
    PARAMETER = 3,
}

export interface AnnotationTarget<T, A extends Annotation> {
    readonly location: AnnotationLocation<T, A>;
    readonly type: A extends ClassAnnotation
        ? AnnotationTargetType.CLASS
        : A extends PropertyAnnotation
        ? AnnotationTargetType.PROPERTY
        : A extends MethodAnnotation
        ? AnnotationTargetType.METHOD
        : A extends ParameterAnnotation
        ? AnnotationTargetType.PARAMETER
        : never;
    readonly proto: any;
    readonly name: string;
    readonly label: string;
    readonly ref: string;

    readonly propertyKey: A extends PropertyAnnotation | MethodAnnotation | ParameterAnnotation ? string : never;
    readonly descriptor: A extends MethodAnnotation ? TypedPropertyDescriptor<T> : never;
    readonly parameterIndex: A extends ParameterAnnotation ? number : never;
    readonly parent: A extends MethodAnnotation
        ? AnnotationTarget<any, ClassAnnotation>
        : A extends PropertyAnnotation
        ? AnnotationTarget<any, ClassAnnotation>
        : A extends ParameterAnnotation
        ? AnnotationTarget<any, MethodAnnotation>
        : ClassAnnotationTarget<any>;
    readonly declaringClass: ClassAnnotationTarget<T>;
    readonly parentClass: ClassAnnotationTarget<T>;
}

export interface ClassAnnotationTarget<T> extends AnnotationTarget<T, ClassAnnotation> {
    readonly type: AnnotationTargetType.CLASS;
    readonly location: ClassAnnotationLocation<T>;
    readonly parent: ClassAnnotationTarget<any>;
}

export interface PropertyAnnotationTarget<T> extends AnnotationTarget<T, PropertyAnnotation> {
    readonly type: AnnotationTargetType.PROPERTY;
    readonly propertyKey: string;
    readonly location: PropertyAnnotationLocation<T>;
    readonly parent: ClassAnnotationTarget<T>;
}

export interface MethodAnnotationTarget<T> extends AnnotationTarget<T, MethodAnnotation> {
    readonly type: AnnotationTargetType.METHOD;
    readonly propertyKey: string;
    readonly descriptor: TypedPropertyDescriptor<T>;
    readonly location: MethodAnnotationLocation<T>;
    readonly parent: ClassAnnotationTarget<T>;
}

export interface ParameterAnnotationTarget<T> extends AnnotationTarget<T, ParameterAnnotation> {
    readonly type: AnnotationTargetType.PARAMETER;
    readonly propertyKey: string;
    readonly parameterIndex: number;
    readonly location: ParameterAnnotationLocation<T>;
    readonly parent: MethodAnnotationTarget<T>;
}
