import { Annotation, AnnotationType } from '../annotation/annotation.types';
import { AnnotationTarget } from '../annotation/target/annotation-target';
import { AnnotationAdviceContext } from './annotation-advice-context';

export interface AspectHooks {
    annotations(...annotations: Annotation[]): AnnotationAspectPointcuts;
}

export interface AnnotationAspectPointcuts {
    class: ClassPointCutHooks;
    property: PropertyPointCutHooks;
    method: MethodPointCutHooks;
    parameter: ParameterPointCutHooks;
}
export interface PointCutHooks {
    setup<T>(advice: SetupAdvice<T>): this;
    around<T>(advice: AroundAdvice<T>): this;
    before<T>(advice: BeforeAdvice<T>): this;
    afterReturn<T>(advice: AfterReturnAdvice<T>): this;
    after<T>(advice: AfterAdvice<T>): this;
    afterThrow<T>(advice: AfterThrowAdvice<T>): this;
}

export interface ClassPointCutHooks {
    setup<T>(advice: SetupAdvice<T>): this;
    before<T>(advice: BeforeClassAdvice<T>): this;
    around<T>(advice: AroundAdvice<T>): this;
    afterReturn<T>(advice: AfterReturnAdvice<T>): this;
    after<T>(advice: AfterAdvice<T>): this;
    afterThrow<T>(advice: AfterThrowAdvice<T>): this;
}
export type PropertyPointCutHooks = PointCutHooks;
export type MethodPointCutHooks = PointCutHooks;
export type ParameterPointCutHooks = PointCutHooks;

export const POINTCUT_NAMES: (keyof PointCutHooks)[] = [
    'setup',
    'before',
    'after',
    'afterReturn',
    'afterThrow',
    'around',
];

export abstract class Aspect {
    name: string;
    abstract apply(hooks: AspectHooks): void;
}

export type SetupAdvice<T> = (target: AnnotationTarget<T, AnnotationType>) => void;
export type BeforeAdvice<T> = (ctxt: AnnotationAdviceContext<T, AnnotationType>) => void;
export type BeforeClassAdvice<T> = (ctxt: Omit<AnnotationAdviceContext<T, AnnotationType>, 'instance'>) => void;
export type AfterAdvice<T> = (ctxt: AnnotationAdviceContext<T, AnnotationType>) => void;
export type AfterReturnAdvice<T> = (
    ctxt: AnnotationAdviceContext<T, AnnotationType>,
    returnValue: any,
) => T | null | undefined;
export type AfterThrowAdvice<T> = (ctxt: AnnotationAdviceContext<T, AnnotationType>) => T | null | undefined;
export type AroundAdvice<T> = (
    ctxt: AnnotationAdviceContext<T, AnnotationType>,
    joinPoint: JoinPoint,
    joinpointArgs: any[],
) => any; // TODO change return value;
export type Advice<T> =
    | SetupAdvice<T>
    | BeforeAdvice<T>
    | AfterAdvice<T>
    | AfterReturnAdvice<T>
    | AfterThrowAdvice<T>
    | AroundAdvice<T>;

export type JoinPoint = (args?: any[]) => any;

export interface PointCutHooks {
    setup<T>(advice: SetupAdvice<T>): this;
    around<T>(advice: AroundAdvice<T>): this;
    before<T>(advice: BeforeAdvice<T>): this;
    afterReturn<T>(advice: AfterReturnAdvice<T>): this;
    after<T>(advice: AfterAdvice<T>): this;
    afterThrow<T>(advice: AfterThrowAdvice<T>): this;
}
