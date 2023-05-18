import type { TargetType } from '../annotation.types';

export type MethodPropertyDescriptor = PropertyDescriptor & {
  value: (...args: any[]) => any;
  get: never;
};

export type Prototype<X = unknown> = Record<string, unknown> & {
  constructor: new (...args: unknown[]) => X;
};

/**
 * @internal
 */
export class _AnnotationTargetRef {
  constructor(public readonly value: string) {}
  toString() {
    return this.value;
  }
}

/**
 * @internal
 */
interface _BaseAnnotationTarget<
  T extends TargetType = TargetType,
  X = unknown,
> {
  readonly type: T;
  readonly proto: Prototype<X>;
  readonly name: string;
  readonly label: string;
  readonly ref: _AnnotationTargetRef;
  readonly declaringClass: ClassAnnotationTarget<X>;
  readonly parentClass: ClassAnnotationTarget<X> | undefined;
}

/**
 * Target for an annotated class.
 * @param X the type of the class
 */
export interface ClassAnnotationTarget<X = unknown>
  extends _BaseAnnotationTarget<TargetType.CLASS, X> {
  readonly parent?: ClassAnnotationTarget<unknown>;
}

/**
 * Target for an annotated property.
 * @param X the type of the property's class
 */
export interface PropertyAnnotationTarget<X = unknown>
  extends _BaseAnnotationTarget<TargetType.PROPERTY, X> {
  readonly propertyKey: string;
  readonly parent: ClassAnnotationTarget<unknown>;
  readonly descriptor: TypedPropertyDescriptor<unknown>;
}

/**
 * Target for an annotated method.
 * @param X the type of the method's class
 */
export interface MethodAnnotationTarget<X = unknown>
  extends _BaseAnnotationTarget<TargetType.METHOD, X> {
  readonly propertyKey: string;
  readonly descriptor: MethodPropertyDescriptor;
  readonly parent: ClassAnnotationTarget<X>;
}

/**
 * Target for an annotated parameter.
 * @param X the type of the parameter's class
 */
export interface ParameterAnnotationTarget<X = unknown>
  extends _BaseAnnotationTarget<TargetType.PARAMETER, X> {
  readonly propertyKey: string;
  readonly parameterIndex: number;
  readonly descriptor: MethodPropertyDescriptor;
  readonly parent: MethodAnnotationTarget<X>;
}

/**
 * Represents the symbol (Class, Method, Parameter, Property) annotated by an annotation.
 * @param T The kind of annotation
 * @param X The type of the class that target belongs to.
 */
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
