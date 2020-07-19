import { AdviceContext } from './advice-context';
import {
    AfterPointcut,
    AfterReturnPointcut,
    AfterThrowPointcut,
    AroundPointcut,
    BeforePointcut,
    CompilePointcut,
} from './pointcut';
import { AnnotationType } from '../annotation/annotation.types';
import { JoinPoint } from '../weaver/types';

export type CompileAdvice<T, A extends AnnotationType> = {
    name: string;
    aspect: object;
    pointcut?: CompilePointcut;
} & ((ctxt: AdviceContext<T, A>) => void | Function | PropertyDescriptor);

export type BeforeAdvice<T> = {
    name: string;
    aspect: object;
    pointcut?: BeforePointcut;
} & ((ctxt: AdviceContext<T, AnnotationType>) => void);
export type BeforeClassAdvice<T> = {
    name: string;
    aspect: object;
    pointcut?: BeforePointcut;
} & ((ctxt: Omit<AdviceContext<T, AnnotationType>, 'instance'>) => void);
export type AfterAdvice<T> = {
    name: string;
    aspect: object;
    pointcut?: AfterPointcut;
} & ((ctxt: AdviceContext<T, AnnotationType>) => void);
export type AfterReturnAdvice<T> = {
    name: string;
    aspect: object;
    pointcut?: AfterReturnPointcut;
} & ((ctxt: AdviceContext<T, AnnotationType>, returnValue: any) => T | null | undefined);
export type AfterThrowAdvice<T> = {
    name: string;
    aspect: object;
    pointcut?: AfterThrowPointcut;
} & ((ctxt: AdviceContext<T, AnnotationType>, thrownError: Error) => T | null | undefined);
export type AroundAdvice<T> = {
    name: string;
    aspect: object;
    pointcut?: AroundPointcut;
} & ((ctxt: AdviceContext<T, AnnotationType>, joinPoint: JoinPoint, args: any[]) => any);

export type Advice =
    | CompileAdvice<any, AnnotationType>
    | BeforeAdvice<any>
    | AfterAdvice<any>
    | AfterReturnAdvice<any>
    | AfterThrowAdvice<any>
    | AroundAdvice<any>;
