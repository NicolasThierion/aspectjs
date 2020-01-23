import { AnnotationContext } from '../../annotation/context/context';
import { JoinPoint } from '../../index';
import { AdviceType } from './types';
import { AdviceTarget } from '../../annotation/target/advice-target';

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
    readonly target: AdviceTarget<T, A>;
}

export interface BeforeContext<T, A extends AdviceType> {
    readonly annotation: AnnotationContext<T, A>;
    readonly instance: A extends AdviceType.CLASS ? never : T;
    readonly args: any[];
    readonly target: AdviceTarget<T, A>;
}

export interface AfterReturnContext<T, A extends AdviceType> {
    readonly annotation: AnnotationContext<T, A>;
    readonly instance: T;
    readonly args: any[];
    readonly target: AdviceTarget<T, A>;
    readonly value: any;
}

export interface AfterThrowContext<T, A extends AdviceType> {
    readonly annotation: AnnotationContext<T, A>;
    readonly instance: T;
    readonly args: any[];
    readonly error: Error;
    readonly target: AdviceTarget<T, A>;
    readonly value: any;
}

export interface AroundContext<T, A extends AdviceType> {
    readonly annotation: AnnotationContext<T, A>;
    readonly instance: T;
    readonly args: any[];
    readonly error: Error;
    readonly joinpoint: JoinPoint;
    readonly target: AdviceTarget<T, A>;
}

export interface CompileContext<T, A extends AdviceType> {
    readonly annotation: AnnotationContext<T, A>;
    readonly target: AdviceTarget<T, A>;
}

export type MutableAdviceContext<A extends AdviceType> = {
    annotation?: AnnotationContext<unknown, A>;
    instance?: unknown;
    value?: unknown;
    args?: unknown[];
    error?: Error;
    joinpoint?: JoinPoint;
    target: AdviceTarget<any, A>;

    clone(): AdviceContext<any, A>;
};
