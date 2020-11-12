import { AnnotationType } from '../annotation.types';

/**
 * @public
 */
export type ClassAnnotationLocation<T = unknown> = {
    [prop in keyof T]: T[prop] extends (...any: any[]) => any
        ? MethodAnnotationLocation<T, T[prop]>
        : PropertyAnnotationLocation<T, T[prop]>;
};

/**
 * @public
 */
export type MethodAnnotationLocation<T = unknown, P = unknown> = {
    args: ParametersAnnotationLocation<T>;
};
/**
 * @public
 */
export type PropertyAnnotationLocation<T = unknown, P = unknown> = {
    [prop: string]: never;
};
/**
 * @public
 */
export type ParametersAnnotationLocation<T = unknown> = {
    [prop: string]: never;
} & [];
/**
 * @public
 */
export type AnnotationLocation<T = unknown, A extends AnnotationType = any> = undefined | A extends AnnotationType.CLASS
    ? ClassAnnotationLocation<T>
    : A extends AnnotationType.PROPERTY
    ? PropertyAnnotationLocation
    : A extends AnnotationType.METHOD
    ? MethodAnnotationLocation
    : ParametersAnnotationLocation;
