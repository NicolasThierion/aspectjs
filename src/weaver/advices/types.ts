import { AnnotationTarget } from '../annotation/target/annotation-target';
import { AnnotationRef, AnnotationType, JoinPoint } from '../..';
import { AdviceContext } from '../advice-context';

export enum PointcutName {
    SETUP = 'setup',
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

export interface SetupPointcut {
    annotation: AnnotationRef;
    name: PointcutName.SETUP;
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

export type SetupAdvice<T> = {
    pointcut?: SetupPointcut;
} & ((target: AnnotationTarget<T, AnnotationType>) => void);
export type BeforeAdvice<T> = {
    pointcut?: BeforePointcut;
} & ((ctxt: AdviceContext<T, AnnotationType>) => void);
export type BeforeClassAdvice<T> = {
    pointcut?: BeforePointcut;
} & ((ctxt: Omit<AdviceContext<T, AnnotationType>, 'instance'>) => void);
export type AfterAdvice<T> = {
    pointcut?: AfterPointcut;
} & ((ctxt: AdviceContext<T, AnnotationType>) => void);
export type AfterReturnAdvice<T> = {
    pointcut?: AfterReturnPointcut;
} & ((ctxt: AdviceContext<T, AnnotationType>, returnValue: any) => T | null | undefined);
export type AfterThrowAdvice<T> = {
    pointcut?: AfterThrowPointcut;
} & ((ctxt: AdviceContext<T, AnnotationType>) => T | null | undefined);
export type AroundAdvice<T> = {
    pointcut?: AroundPointcut;
} & ((ctxt: AdviceContext<T, AnnotationType>, joinPoint: JoinPoint, joinpointArgs: any[]) => any); // TODO change return value;

export type Advice = AnnotationAdvice;

export type AnnotationAdvice =
    | SetupAdvice<any>
    | BeforeAdvice<any>
    | AfterAdvice<any>
    | AfterReturnAdvice<any>
    | AfterThrowAdvice<any>
    | AroundAdvice<any>;
