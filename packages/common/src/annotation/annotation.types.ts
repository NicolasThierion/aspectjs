import type { AnnotationRef } from './annotation-ref';

/* eslint-disable @typescript-eslint/ban-types */

/**
 * Type of an annotation.
 */
// TODO: rename to AnnotationKind
export enum AnnotationType {
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
export type AnnotationStub<T extends AnnotationType = AnnotationType> = (
  ...args: any[]
) => Decorator<T> | void;

/**
 * @description An Annotation is an EcmaScript decorator with no behavior.
 * It is identified by a name and a group ID.
 *
 * @typeparam T - The type of the annotation, derived from `AnnotationType`.
 * @typeparam S - The type of the annotation stub, derived from `AnnotationStub<T>`.
 */
export type Annotation<
  T extends AnnotationType = any,
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
export type Decorator<T extends AnnotationType = AnnotationType> =
  T extends AnnotationType.CLASS
    ? ClassDecorator
    : T extends AnnotationType.METHOD
    ? MethodDecorator
    : T extends AnnotationType.PARAMETER
    ? ParameterDecorator
    : T extends AnnotationType.PROPERTY
    ? PropertyDecorator
    : any;

/**
 * @internal
 */
export type AnyDecorator = ClassDecorator &
  MethodDecorator &
  ParameterDecorator &
  PropertyDecorator;
