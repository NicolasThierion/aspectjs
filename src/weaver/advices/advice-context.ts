import { AnnotationContext } from '../../annotation/context/context';
import { Annotation, JoinPoint } from '../../index';
import { InstanceResolver } from '../instance-resolver';
import { AnnotationTarget } from '../../annotation/target/annotation-target';

export type AdviceContext<T, A extends Annotation> =
    | AfterContext<T, A>
    | BeforeContext<T, A>
    | AfterReturnContext<T, A>
    | AfterThrowContext<T, A>
    | AroundContext<T, A>
    | SetupContext<T, A>;

export interface AfterContext<T, A extends Annotation> {
    readonly annotation: AnnotationContext<T, A>;
    readonly instance: InstanceResolver<T>;
    readonly args: any[];
}

export interface BeforeContext<T, A extends Annotation> {
    readonly annotation: AnnotationContext<T, A>;
    readonly args: any[];
}

export interface AfterReturnContext<T, A extends Annotation> {
    readonly annotation: AnnotationContext<T, A>;
    readonly instance: InstanceResolver<T>;
    readonly args: any[];
    readonly returnValue: any;
}

export interface AfterThrowContext<T, A extends Annotation> {
    readonly annotation: AnnotationContext<T, A>;
    readonly instance: InstanceResolver<T>;
    readonly args: any[];
    readonly error: Error;
}

export interface AroundContext<T, A extends Annotation> {
    readonly annotation: AnnotationContext<T, A>;
    readonly instance: InstanceResolver<T>;
    readonly args: any[];
    readonly error: Error;
    readonly joinpoint: JoinPoint;
    readonly joinpointArgs: any[];
}

export interface SetupContext<T, A extends Annotation> {
    readonly annotation: AnnotationContext<T, A>;
    readonly target: AnnotationTarget<T, A>;
}

export type MutableAdviceContext<A extends Annotation> = {
    annotation?: AnnotationContext<unknown, A>;
    instance?: InstanceResolver<unknown>;
    args?: unknown[];
    error?: Error;
    returnValue?: unknown;
    joinpoint?: JoinPoint;
    joinpointArgs?: any[];
    freeze(): AdviceContext<unknown, A>;
};
