import { WEAVER_CONTEXT } from '../../weaver/weaver-context';
import { AdviceType } from '../../advice/types';
import { AnnotationTarget, ClassAdviceTarget } from '../target/annotation-target';
import { getProto } from '@aspectjs/core/utils';
import { AnnotationType } from '../annotation.types';

export type ClassAnnotationLocation<T = unknown> = {
    [prop in keyof T]: T[prop] extends (...any: any[]) => any
        ? MethodAnnotationLocation<T, T[prop]>
        : PropertyAnnotationLocation<T, T[prop]>;
};

export type MethodAnnotationLocation<T = unknown, P = unknown> = {
    args: ParametersAnnotationLocation<T>;
};
export type PropertyAnnotationLocation<T = unknown, P = unknown> = {
    [prop: string]: never;
};
export type ParametersAnnotationLocation<T = unknown> = {
    [prop: string]: never;
} & [];
export type AnnotationLocation<T = unknown, A extends AnnotationType = any> = undefined | A extends AnnotationType.CLASS
    ? ClassAnnotationLocation<T>
    : A extends AnnotationType.PROPERTY
    ? PropertyAnnotationLocation
    : A extends AnnotationType.METHOD
    ? MethodAnnotationLocation
    : ParametersAnnotationLocation;
