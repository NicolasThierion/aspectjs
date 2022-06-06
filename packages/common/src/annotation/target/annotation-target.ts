import type { TargetType } from '../annotation.types';

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
  T extends TargetType = TargetType,
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
  extends _BaseAnnotationTarget<TargetType.CLASS, X> {
  readonly parent?: ClassAnnotationTarget<unknown>;
}

export interface PropertyAnnotationTarget<X = unknown>
  extends _BaseAnnotationTarget<TargetType.PROPERTY, X> {
  readonly propertyKey: string;
  readonly parent: ClassAnnotationTarget<unknown>;
  readonly descriptor: TypedPropertyDescriptor<unknown>;
}

export interface MethodAnnotationTarget<X = unknown>
  extends _BaseAnnotationTarget<TargetType.METHOD, X> {
  readonly propertyKey: string;
  readonly descriptor: TypedPropertyDescriptor<unknown>;
  readonly parent: ClassAnnotationTarget<X>;
}

export interface ParameterAnnotationTarget<X = unknown>
  extends _BaseAnnotationTarget<TargetType.PARAMETER, X> {
  readonly propertyKey: string;
  readonly parameterIndex: number;
  readonly descriptor: TypedPropertyDescriptor<unknown>;
  readonly parent: MethodAnnotationTarget<X>;
}

export type AnnotationTarget<
  T extends TargetType = TargetType,
  X = unknown,
> = T extends TargetType.CLASS
  ? ClassAnnotationTarget<X>
  : T extends TargetType.PARAMETER
  ? ParameterAnnotationTarget<X>
  : T extends TargetType.METHOD
  ? MethodAnnotationTarget<X>
  : T extends TargetType.PROPERTY
  ? PropertyAnnotationTarget<X>
  : never;
