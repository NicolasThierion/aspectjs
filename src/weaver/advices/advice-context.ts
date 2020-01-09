import { AnnotationContext } from '../../annotation/context/context';
import { JoinPoint } from '../../index';
import { AdviceType } from './types';

export type AdviceContext<T, A extends AdviceType> =
    | AfterContext<T, A>
    | BeforeContext<T, A>
    | AfterReturnContext<T, A>
    | AfterThrowContext<T, A>
    | AroundContext<T, A>
    | CompileContext<T, A>;

export interface AfterContext<T, A extends AdviceType> {
    readonly annotation: AnnotationContext<T, A>;
    readonly instance: T;
    readonly args: any[];
}

export interface BeforeContext<T, A extends AdviceType> {
    readonly annotation: AnnotationContext<T, A>;
    readonly args: any[];
}

export interface AfterReturnContext<T, A extends AdviceType> {
    readonly annotation: AnnotationContext<T, A>;
    readonly instance: T;
    readonly args: any[];
    readonly returnValue: any;
}

export interface AfterThrowContext<T, A extends AdviceType> {
    readonly annotation: AnnotationContext<T, A>;
    readonly instance: T;
    readonly args: any[];
    readonly error: Error;
}

export interface AroundContext<T, A extends AdviceType> {
    readonly annotation: AnnotationContext<T, A>;
    readonly instance: T;
    readonly args: any[];
    readonly error: Error;
    readonly joinpoint: JoinPoint;
    readonly joinpointArgs: any[];
}

export interface CompileContext<T, A extends AdviceType> {
    readonly annotation: AnnotationContext<T, A>;
}

export type MutableAdviceContext<A extends AdviceType> = {
    annotation?: AnnotationContext<unknown, A>;
    instance?: unknown;
    value?: unknown;
    args?: unknown[];
    error?: Error;
    returnValue?: unknown;
    joinpoint?: JoinPoint;
    joinpointArgs?: any[];
    freeze(): AdviceContext<unknown, A>;
};
