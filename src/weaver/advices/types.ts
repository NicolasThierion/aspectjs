import { AnnotationTarget } from '../../annotation/target/annotation-target';
import { AnnotationRef, Annotation, JoinPoint } from '../..';
import { AdviceContext } from './advice-context';

export enum PointcutName {
    COMPILE = 'compile',
    AROUND = 'around',
    BEFORE = 'before',
    AFTERRETURN = 'afterReturn',
    AFTER = 'after',
    AFTERTHROW = 'afterThrow',
}

export interface Pointcut {
    annotation: AnnotationRef;
    name: PointcutName;
}

export interface CompilePointcut {
    annotation: AnnotationRef;
    name: PointcutName.COMPILE;
}
export interface AroundPointcut {
    annotation: AnnotationRef;
    name: PointcutName.AROUND;
}
export interface BeforePointcut {
    annotation: AnnotationRef;
    name: PointcutName.BEFORE;
}
export interface AfterReturnPointcut {
    annotation: AnnotationRef;
    name: PointcutName.AFTERRETURN;
}
export interface AfterPointcut {
    annotation: AnnotationRef;
    name: PointcutName.AFTER;
}
export interface AfterThrowPointcut {
    annotation: AnnotationRef;
    name: PointcutName.AFTERTHROW;
}

export type CompileAdvice<T> = {
    pointcut?: CompilePointcut;
} & ((target: AnnotationTarget<T, Annotation>) => void);
export type BeforeAdvice<T> = {
    pointcut?: BeforePointcut;
} & ((ctxt: AdviceContext<T, Annotation>) => void);
export type BeforeClassAdvice<T> = {
    pointcut?: BeforePointcut;
} & ((ctxt: Omit<AdviceContext<T, Annotation>, 'instance'>) => void);
export type AfterAdvice<T> = {
    pointcut?: AfterPointcut;
} & ((ctxt: AdviceContext<T, Annotation>) => void);
export type AfterReturnAdvice<T> = {
    pointcut?: AfterReturnPointcut;
} & ((ctxt: AdviceContext<T, Annotation>, returnValue: any) => T | null | undefined);
export type AfterThrowAdvice<T> = {
    pointcut?: AfterThrowPointcut;
} & ((ctxt: AdviceContext<T, Annotation>) => T | null | undefined);
export type AroundAdvice<T> = {
    pointcut?: AroundPointcut;
} & ((ctxt: AdviceContext<T, Annotation>, joinPoint: JoinPoint, joinpointArgs: any[]) => any); // TODO change return value;

export type Advice = AnnotationAdvice;

export type AnnotationAdvice =
    | CompileAdvice<any>
    | BeforeAdvice<any>
    | AfterAdvice<any>
    | AfterReturnAdvice<any>
    | AfterThrowAdvice<any>
    | AroundAdvice<any>;
