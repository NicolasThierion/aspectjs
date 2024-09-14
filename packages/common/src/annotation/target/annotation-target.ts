import { MethodPropertyDescriptor, Prototype } from '@aspectjs/common/utils';
import type { AnnotationKind } from '../annotation.types';

/**
 * @internal
 */
export class AnnotationTargetRef {
  constructor(public readonly value: string) {}
  toString() {
    return this.value;
  }
}

/**
 * @internal
 */
export interface BaseAnnotationTarget<
  T extends AnnotationKind = AnnotationKind,
  X = unknown,
> {
  readonly kind: T;
  readonly proto: Prototype<X>;
  readonly name: string;
  readonly label: string;
  readonly ref: AnnotationTargetRef;
  readonly declaringClass: ClassAnnotationTarget<X>;
  readonly parentClass: ClassAnnotationTarget<unknown> | undefined;
  readonly static: boolean;
  asDecoratorArgs(): any[];

  eval(): unknown;

  defineMetadata(key: string, value: any): void;
  getMetadata<T extends unknown>(key: string, defaultvalue: () => T): T;
  getMetadata<T extends unknown>(
    key: string,
    defaultvalue?: () => T,
  ): T | undefined;
}

/**
 * Target for an annotated class.
 * @param X the type of the class
 */
export interface ClassAnnotationTarget<X = unknown>
  extends BaseAnnotationTarget<AnnotationKind.CLASS, X> {
  readonly parentClass: ClassAnnotationTarget<unknown> | undefined;
  readonly static: boolean;
}

/**
 * Target for an annotated property.
 * @param X the type of the property's class
 */
export interface PropertyAnnotationTarget<X = unknown>
  extends BaseAnnotationTarget<AnnotationKind.PROPERTY, X> {
  readonly propertyKey: string | symbol;
  readonly declaringClass: ClassAnnotationTarget<X>;
  readonly descriptor?: TypedPropertyDescriptor<unknown>;
  readonly static: boolean;
}

/**
 * Target for an annotated method.
 * @param X the type of the method's class
 */
export interface MethodAnnotationTarget<X = unknown>
  extends BaseAnnotationTarget<AnnotationKind.METHOD, X> {
  readonly propertyKey: string | symbol;
  readonly descriptor: MethodPropertyDescriptor;
  readonly declaringClass: ClassAnnotationTarget<X>;
  readonly static: boolean;
}

/**
 * Target for an annotated parameter.
 * @param X the type of the parameter's class
 */
export interface ParameterAnnotationTarget<X = unknown>
  extends BaseAnnotationTarget<AnnotationKind.PARAMETER, X> {
  readonly propertyKey: string | symbol;
  readonly parameterIndex: number;
  readonly descriptor: MethodPropertyDescriptor;
  readonly declaringMethod: MethodAnnotationTarget<X>;
  readonly declaringClass: ClassAnnotationTarget<X>;
  readonly static: boolean;
}

/**
 * Represents the symbol (Class, Method, Parameter, Property) annotated by an annotation.
 * @param T The kind of annotation
 * @param X The type of the class that target belongs to.
 */
export type AnnotationTarget<
  T extends AnnotationKind = AnnotationKind,
  X = unknown,
> = T extends AnnotationKind.CLASS
  ? ClassAnnotationTarget<X>
  : T extends AnnotationKind.PARAMETER
  ? ParameterAnnotationTarget<X>
  : T extends AnnotationKind.METHOD
  ? MethodAnnotationTarget<X>
  : T extends AnnotationKind.PROPERTY
  ? PropertyAnnotationTarget<X>
  : never;
