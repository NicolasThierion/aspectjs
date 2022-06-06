import type { AnnotationRef } from './annotation-ref';

/* eslint-disable @typescript-eslint/ban-types */
export enum TargetType {
  CLASS = 0b0001,
  PROPERTY = 0b0010,
  METHOD = 0b0100,
  PARAMETER = 0b1000,
}

export enum AnnotationType {
  CLASS = 0b0001,
  PROPERTY = 0b0010,
  METHOD = 0b0100,
  PARAMETER = 0b1000,
  ANY = 0b1111,
}

type ClassDecorator = <TFunction extends Function>(
  target: TFunction,
) => TFunction;
type MethodDecorator = <X>(
  target: Object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<X>,
) => TypedPropertyDescriptor<X>;

export type AnnotationStub<T extends AnnotationType = AnnotationType> = (
  ...args: any[]
) => Decorator<T> | void;

export type DecoratorFactory<
  S extends AnnotationStub,
  T extends AnnotationType = AnnotationType,
> = (...args: Parameters<S>) => Decorator<T>;

/**
 * An Annotation is an EcmaScript decorator with no behavior.
 */
export type Annotation<
  T extends AnnotationType = AnnotationType,
  S extends AnnotationStub<T> = AnnotationStub<T>,
> = { ref: AnnotationRef } & {
  readonly name: string;
  readonly groupId: string;
} & ((...args: Parameters<S>) => Decorator<T>);

export type Decorator<T extends AnnotationType = AnnotationType> =
  T extends AnnotationType.CLASS
    ? ClassDecorator
    : T extends AnnotationType.METHOD
    ? MethodDecorator
    : T extends AnnotationType.PARAMETER
    ? ParameterDecorator
    : T extends AnnotationType.PROPERTY
    ? PropertyDecorator
    : AnyDecorator;

export type AnyDecorator = ClassDecorator &
  MethodDecorator &
  ParameterDecorator &
  PropertyDecorator;
