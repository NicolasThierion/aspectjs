import { Annotation, AnnotationType } from '../annotation/annotation.types';
import { AnnotationContext } from '../annotation/context/context';
import { AnnotationTarget } from '../annotation/target/annotation-target';

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
export type BeforeAdvice<T> = (ctxt: AnnotationContext<T, AnnotationType>) => void;
export type BeforeClassAdvice<T> = (ctxt: Omit<AnnotationContext<T, AnnotationType>, 'instance'>) => void;
export type AfterAdvice<T> = BeforeAdvice<T>;
export type AfterReturnAdvice<T> = BeforeAdvice<T>;
export type AfterThrowAdvice<T> = BeforeAdvice<T>;
export type AroundAdvice<T> = (ctxt: AnnotationContext<T, AnnotationType>, joinPoint: JoinPoint) => void;
export type Advice<T> =
    | SetupAdvice<T>
    | BeforeAdvice<T>
    | AfterAdvice<T>
    | AfterReturnAdvice<T>
    | AfterThrowAdvice<T>
    | AroundAdvice<T>;
export type JoinPoint = Function;
