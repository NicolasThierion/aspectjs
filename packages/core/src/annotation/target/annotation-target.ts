import { AdviceType } from '../../advice/types';
import {
    AnnotationLocation,
    ClassAnnotationLocation,
    MethodAnnotationLocation,
    ParametersAnnotationLocation,
    PropertyAnnotationLocation,
} from '../location/annotation-location';

export interface AnnotationTarget<T = unknown, A extends AdviceType = AdviceType> {
    readonly location: AnnotationLocation<T, A>;
    readonly type: A;
    readonly proto: Record<string, any> & { constructor: new (...args: any[]) => any };
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
        : ClassAdviceTarget<any>;
    readonly declaringClass: ClassAdviceTarget<T>;
    readonly parentClass: ClassAdviceTarget<T>;
}
export type AdviceTarget<T = unknown, A extends AdviceType = any> = AnnotationTarget<T, A>;

export interface ClassAdviceTarget<T> extends AdviceTarget<T, AdviceType.CLASS> {
    readonly location: ClassAnnotationLocation<T>;
    readonly parent: ClassAdviceTarget<any>;
}

export interface PropertyAdviceTarget<T> extends AdviceTarget<T, AdviceType.PROPERTY> {
    readonly propertyKey: string;
    readonly location: PropertyAnnotationLocation<T>;
    readonly parent: ClassAdviceTarget<T>;
}

export interface MethodAdviceTarget<T> extends AdviceTarget<T, AdviceType.METHOD> {
    readonly descriptor: TypedPropertyDescriptor<T>;
    readonly location: MethodAnnotationLocation<T>;
    readonly parent: ClassAdviceTarget<T>;
}

export interface ParameterAdviceTarget<T> extends AdviceTarget<T, AdviceType.PARAMETER> {
    readonly propertyKey: string;
    readonly parameterIndex: number;
    readonly location: ParametersAnnotationLocation<T>;
    readonly parent: MethodAdviceTarget<T>;
}
