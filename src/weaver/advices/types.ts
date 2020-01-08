import { Annotation, JoinPoint } from '../..';
import { AdviceContext } from './advice-context';
import {
    AfterPointcut,
    AfterReturnPointcut,
    AfterThrowPointcut,
    AroundPointcut,
    BeforePointcut,
    CompilePointcut,
} from './pointcut';

export enum AdviceType {
    CLASS = 0,
    PROPERTY = 1,
    METHOD = 2,
    PARAMETER = 3,
}

export type CompileAdvice<T, A extends AdviceType> = A extends AdviceType.CLASS
    ? ClassCompileAdvice<T>
    : A extends AdviceType.PROPERTY
    ? PropertyCompileAdvice<T>
    : never;

export type ClassCompileAdvice<T> = {
    pointcut?: CompilePointcut;
} & ((ctxt: AdviceContext<T, AdviceType>) => void | Function);

export type PropertyCompileAdvice<T> = {
    pointcut?: CompilePointcut;
} & ((ctxt: AdviceContext<T, AdviceType>) => void | PropertyDescriptor);

export type BeforeAdvice<T> = {
    pointcut?: BeforePointcut;
} & ((ctxt: AdviceContext<T, AdviceType>) => void);
export type BeforeClassAdvice<T> = {
    pointcut?: BeforePointcut;
} & ((ctxt: Omit<AdviceContext<T, AdviceType>, 'instance'>) => void);
export type AfterAdvice<T> = {
    pointcut?: AfterPointcut;
} & ((ctxt: AdviceContext<T, AdviceType>) => void);
export type AfterReturnAdvice<T> = {
    pointcut?: AfterReturnPointcut;
} & ((ctxt: AdviceContext<T, AdviceType>, returnValue: any) => T | null | undefined);
export type AfterThrowAdvice<T> = {
    pointcut?: AfterThrowPointcut;
} & ((ctxt: AdviceContext<T, AdviceType>) => T | null | undefined);
export type AroundAdvice<T> = {
    pointcut?: AroundPointcut;
} & ((ctxt: AdviceContext<T, AdviceType>, joinPoint: JoinPoint, joinpointArgs: any[]) => any); // TODO change return value;

export type Advice =
    | CompileAdvice<any, AdviceType>
    | BeforeAdvice<any>
    | AfterAdvice<any>
    | AfterReturnAdvice<any>
    | AfterThrowAdvice<any>
    | AroundAdvice<any>;
