import {
    AdviceLocation,
    ClassAdviceLocation,
    MethodAdviceLocation,
    ParameterAdviceLocation,
    PropertyAdviceLocation,
} from '../location/location';
import { AdviceType } from '../../weaver/advices/types';

export interface AdviceTarget<T, A extends AdviceType> {
    readonly location: AdviceLocation<T, A>;
    readonly type: A;
    readonly proto: any;
    readonly name: string;
    readonly label: string;
    readonly ref: string;

    readonly propertyKey: A extends AdviceType.PROPERTY | AdviceType.METHOD | AdviceType.PARAMETER ? string : never;
    readonly descriptor: A extends AdviceType.METHOD ? TypedPropertyDescriptor<T> : never;
    readonly parameterIndex: A extends AdviceType.PARAMETER ? number : never;
    readonly parent: A extends AdviceType.METHOD
        ? AdviceTarget<any, AdviceType.CLASS>
        : A extends AdviceType.PROPERTY
        ? AdviceTarget<any, AdviceType.CLASS>
        : A extends AdviceType.PARAMETER
        ? AdviceTarget<any, AdviceType.METHOD>
        : ClassAdviceTarget<any>;
    readonly declaringClass: ClassAdviceTarget<T>;
    readonly parentClass: ClassAdviceTarget<T>;
}

export interface ClassAdviceTarget<T> extends AdviceTarget<T, AdviceType.CLASS> {
    readonly location: ClassAdviceLocation<T>;
    readonly parent: ClassAdviceTarget<any>;
}

export interface PropertyAdviceTarget<T> extends AdviceTarget<T, AdviceType.PROPERTY> {
    readonly propertyKey: string;
    readonly location: PropertyAdviceLocation<T>;
    readonly parent: ClassAdviceTarget<T>;
}

export interface MethodAdviceTarget<T> extends AdviceTarget<T, AdviceType.METHOD> {
    readonly descriptor: TypedPropertyDescriptor<T>;
    readonly location: MethodAdviceLocation<T>;
    readonly parent: ClassAdviceTarget<T>;
}

export interface ParameterAdviceTarget<T> extends AdviceTarget<T, AdviceType.PARAMETER> {
    readonly propertyKey: string;
    readonly parameterIndex: number;
    readonly location: ParameterAdviceLocation<T>;
    readonly parent: MethodAdviceTarget<T>;
}
