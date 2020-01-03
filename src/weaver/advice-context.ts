import { AnnotationContext } from './annotation/context/context';
import { AnnotationType, JoinPoint } from '..';
import { Mutable } from '../utils';
import { InstanceResolver } from './instance-resolver';
import { AnnotationTarget } from './annotation/target/annotation-target';
import { PointcutName } from './advices/types';

export type AdviceContext<T, A extends AnnotationType> =
    | AfterContext<T, A>
    | BeforeContext<T, A>
    | AfterReturnContext<T, A>
    | AfterThrowContext<T, A>
    | AroundContext<T, A>
    | SetupContext<T, A>;

export interface AfterContext<T, A extends AnnotationType> {
    readonly annotation: AnnotationContext<T, A>;
    readonly instance: InstanceResolver<T>;
    readonly args: any[];
}

export interface BeforeContext<T, A extends AnnotationType> {
    readonly annotation: AnnotationContext<T, A>;
    readonly args: any[];
}

export interface AfterReturnContext<T, A extends AnnotationType> {
    readonly annotation: AnnotationContext<T, A>;
    readonly instance: InstanceResolver<T>;
    readonly args: any[];
    readonly returnValue: any;
}

export interface AfterThrowContext<T, A extends AnnotationType> {
    readonly annotation: AnnotationContext<T, A>;
    readonly instance: InstanceResolver<T>;
    readonly args: any[];
    readonly error: Error;
}

export interface AroundContext<T, A extends AnnotationType> {
    readonly annotation: AnnotationContext<T, A>;
    readonly instance: InstanceResolver<T>;
    readonly args: any[];
    readonly error: Error;
    readonly joinpoint: JoinPoint;
    readonly joinpointArgs: any[];
}

export interface SetupContext<T, A extends AnnotationType> {
    readonly annotation: AnnotationContext<T, A>;
    readonly target: AnnotationTarget<T, A>;
}

export type MutableAdviceContext<A extends AnnotationType> = {
    annotation?: AnnotationContext<unknown, A>;
    instance?: InstanceResolver<unknown>;
    args?: unknown[];
    error?: Error;
    returnValue?: unknown;
    joinpoint?: JoinPoint;
    joinpointArgs?: any[];
    freeze(): AdviceContext<unknown, A>;
};
