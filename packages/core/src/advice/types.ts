import { AdviceContext } from './advice-context';

import {
    AfterPointcut,
    AfterReturnPointcut,
    AfterThrowPointcut,
    AroundPointcut,
    BeforePointcut,
    CompilePointcut,
    PointcutPhase,
} from './pointcut';
import { AnnotationType } from '../annotation/annotation.types';
export { AnnotationType as AdviceType };
import { JoinPoint } from '../weaver/types';

export type CompileAdvice<T = unknown, A extends AnnotationType = any> = {
    name: string;
    aspect: object;
    pointcut?: CompilePointcut<A>;
} & ((ctxt: AdviceContext<T, A>) => A extends AnnotationType.CLASS ? undefined | Function : PropertyDescriptor);

export type BeforeAdvice<T = unknown, A extends AnnotationType = any> = {
    name: string;
    aspect: object;
    pointcut?: BeforePointcut;
} & ((ctxt: AdviceContext<T, A>) => void);
export type AfterAdvice<T = unknown, A extends AnnotationType = any> = {
    name: string;
    aspect: object;
    pointcut?: AfterPointcut;
} & ((ctxt: AdviceContext<T, A>) => void);
export type AfterReturnAdvice<T = unknown, A extends AnnotationType = any> = {
    name: string;
    aspect: object;
    pointcut?: AfterReturnPointcut;
} & ((ctxt: AdviceContext<T, A>, returnValue: any) => T | null | undefined);
export type AfterThrowAdvice<T = unknown, A extends AnnotationType = any> = {
    name: string;
    aspect: object;
    pointcut?: AfterThrowPointcut;
} & ((ctxt: AdviceContext<T, A>, thrownError: Error) => T | null | undefined);
export type AroundAdvice<T = unknown, A extends AnnotationType = any> = {
    name: string;
    aspect: object;
    pointcut?: AroundPointcut;
} & ((ctxt: AdviceContext<T, A>, joinPoint: JoinPoint, args: any[]) => any);

export type Advice<
    T = unknown,
    A extends AnnotationType = any,
    V extends PointcutPhase = any
> = V extends PointcutPhase.COMPILE
    ? CompileAdvice<T, A>
    : V extends PointcutPhase.BEFORE
    ? BeforeAdvice<T, A>
    : V extends PointcutPhase.AROUND
    ? AroundAdvice<T, A>
    : V extends PointcutPhase.AFTERRETURN
    ? AfterReturnAdvice<T, A>
    : V extends PointcutPhase.AFTERTHROW
    ? AfterThrowAdvice<T, A>
    : V extends PointcutPhase.AFTER
    ? AfterAdvice<T, A>
    : never;
