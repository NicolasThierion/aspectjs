import type { AnnotationRef } from './annotation-ref';

/* eslint-disable @typescript-eslint/ban-types */

/**
 * Type of an annotation.
 */
export enum AnnotationKind {
  CLASS = 0b0001,
  PROPERTY = 0b0010,
  METHOD = 0b0100,
  PARAMETER = 0b1000,
}

/**
 * @internal
 */
type ClassDecorator = <TFunction extends Function>(
  target: TFunction,
) => TFunction;
/**
 * @internal
 */
type MethodDecorator = <X>(
  target: object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<X>,
) => TypedPropertyDescriptor<X>;

/**
 * @internal
 */
export type AnnotationStub<T extends AnnotationKind = AnnotationKind> = (
  ...args: any[]
) => Decorator<T> | void;

/**
 * An Annotation is an EcmaScript decorator with no behavior.
 * It is identified by a name and a group ID.
 *
 * @typeParam T - The type of the annotation, derived from `AnnotationKind`.
 * @typeParam S - The type of the annotation stub, derived from `AnnotationStub<T>`.
 */
export type Annotation<
  T extends AnnotationKind = any,
  S extends AnnotationStub<T> = AnnotationStub<T>,
> = {
  /**
   * The reference to the annotation
   */
  ref: AnnotationRef;
} & {
  /**
   * The name of the annotation.
   */
  readonly name: string;
  /**
   * The group ID of the annotation.
   */
  readonly groupId: string;
} & ((...args: Parameters<S>) => Decorator<T>);

/**
 * @internal
 */
export type Decorator<T extends AnnotationKind = AnnotationKind> =
  T extends AnnotationKind.CLASS
    ? ClassDecorator
    : T extends AnnotationKind.METHOD
    ? MethodDecorator
    : T extends AnnotationKind.PARAMETER
    ? ParameterDecorator
    : T extends AnnotationKind.PROPERTY
    ? PropertyDecorator
    : any;

/**
 * @internal
 */
export type AnyDecorator = ClassDecorator &
  MethodDecorator &
  ParameterDecorator &
  PropertyDecorator;
