import type { DecoratorType } from '../annotation.types';

export type Prototype<X extends object = object> = Record<string, unknown> & {
  constructor: new (...args: unknown[]) => X;
};

export class AnnotationTargetRef {
  constructor(public readonly value: string) {}
  toString() {
    return this.value;
  }
}
interface _BaseAnnotationTarget<
  T extends DecoratorType = DecoratorType,
  X = unknown,
> {
  readonly type: T;
  readonly proto: Prototype;
  readonly name: string;
  readonly label: string;
  readonly ref: AnnotationTargetRef;
  readonly declaringClass: ClassAnnotationTarget<X>;
  readonly parentClass: ClassAnnotationTarget<X> | undefined;
}

export interface ClassAnnotationTarget<X = unknown>
  extends _BaseAnnotationTarget<DecoratorType.CLASS, X> {
  readonly parent?: ClassAnnotationTarget<unknown>;
}

export interface PropertyAnnotationTarget<X = unknown>
  extends _BaseAnnotationTarget<DecoratorType.PROPERTY, X> {
  readonly propertyKey: string;
  readonly parent: ClassAnnotationTarget<unknown>;
  readonly descriptor: TypedPropertyDescriptor<unknown>;
}

export interface MethodAnnotationTarget<X = unknown>
  extends _BaseAnnotationTarget<DecoratorType.METHOD, X> {
  readonly propertyKey: string;
  readonly descriptor: TypedPropertyDescriptor<unknown>;
  readonly parent: ClassAnnotationTarget<X>;
}

export interface ParameterAnnotationTarget<X = unknown>
  extends _BaseAnnotationTarget<DecoratorType.PARAMETER, X> {
  readonly propertyKey: string;
  readonly parameterIndex: number;
  readonly descriptor: TypedPropertyDescriptor<unknown>;
  readonly parent: MethodAnnotationTarget<X>;
}

export type AnnotationTarget<
  T extends DecoratorType = DecoratorType,
  X = unknown,
> = T extends DecoratorType.CLASS
  ? ClassAnnotationTarget<X>
  : T extends DecoratorType.PARAMETER
  ? ParameterAnnotationTarget<X>
  : T extends DecoratorType.METHOD
  ? MethodAnnotationTarget<X>
  : T extends DecoratorType.PROPERTY
  ? PropertyAnnotationTarget<X>
  : never;
