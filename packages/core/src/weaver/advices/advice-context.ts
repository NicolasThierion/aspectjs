import { AnnotationContext } from '../../annotation/context/context';
import { AnnotationTarget } from '../../annotation/target/annotation-target';
import { AnnotationType } from '../../annotation/annotation.types';
import { JoinPoint } from '../types';

export type AdviceContext<T, A extends AnnotationType> =
    | AfterContext<T, A>
    | BeforeContext<T, A>
    | AfterReturnContext<T, A>
    | AfterThrowContext<T, A>
    | AroundContext<T, A>
    | CompileContext<T, A>;

export interface AfterContext<T, A extends AnnotationType> {
    readonly annotation: AnnotationContext<T, A>;
    readonly instance: T;
    readonly args: any[];
    readonly target: AnnotationTarget<T, A>;
}

export interface BeforeContext<T, A extends AnnotationType> {
    readonly annotation: AnnotationContext<T, A>;
    readonly instance: A extends AnnotationType.CLASS ? never : T;
    readonly args: any[];
    readonly target: AnnotationTarget<T, A>;
}

export interface AfterReturnContext<T, A extends AnnotationType> {
    readonly annotation: AnnotationContext<T, A>;
    readonly instance: T;
    readonly args: any[];
    readonly value: any;
    readonly target: AnnotationTarget<T, A>;
}

export interface AfterThrowContext<T, A extends AnnotationType> {
    readonly annotation: AnnotationContext<T, A>;
    readonly instance: T;
    readonly args: any[];
    readonly error: Error;
    readonly value: any;
    readonly target: AnnotationTarget<T, A>;
}

export interface AroundContext<T, A extends AnnotationType> {
    readonly annotation: AnnotationContext<T, A>;
    readonly instance: T;
    readonly args: any[];
    readonly error: Error;
    readonly joinpoint: JoinPoint;
    readonly target: AnnotationTarget<T, A>;
}

export interface CompileContext<T, A extends AnnotationType> {
    readonly annotation: AnnotationContext<T, A>;
    readonly target: AnnotationTarget<T, A>;
}

export type MutableAdviceContext<A extends AnnotationType> = {
    annotation?: AnnotationContext<unknown, A>;
    instance?: unknown;
    value?: unknown;
    args?: unknown[];
    error?: Error;
    joinpoint?: JoinPoint;
    target: AnnotationTarget<any, A>;

    clone(): AdviceContext<any, A>;
};
