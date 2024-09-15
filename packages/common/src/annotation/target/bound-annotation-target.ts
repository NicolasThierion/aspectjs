import { AnnotationKind } from '../annotation.types';
import {
  ClassAnnotationTarget,
  MethodAnnotationTarget,
  ParameterAnnotationTarget,
  PropertyAnnotationTarget,
} from './annotation-target';

export interface BoundClassAnnotationTarget<X = unknown>
  extends ClassAnnotationTarget<X> {
  eval(): X;
}

interface BoundParameterAnnotationTarget<X = unknown>
  extends ParameterAnnotationTarget<X> {
  eval(): unknown;
}
interface BoundMethodAnnotationTarget<X = unknown>
  extends MethodAnnotationTarget<X> {
  eval(): (...args: unknown[]) => unknown;
}
interface BoundPropertyAnnotationTarget<X = unknown>
  extends PropertyAnnotationTarget<X> {
  eval(): unknown;
}

/**
 * Represents the symbol (Class, Method, Parameter, Property) annotated by an annotation.
 * This symbol is bound to an actual instance, and has a "value" attribute.
 * @param T The kind of annotation
 * @param X The type of the class that target belongs to.
 */
export type BoundAnnotationTarget<
  T extends AnnotationKind = AnnotationKind,
  X = unknown,
> = T extends AnnotationKind.CLASS
  ? BoundClassAnnotationTarget<X>
  : T extends AnnotationKind.PARAMETER
  ? BoundParameterAnnotationTarget<X>
  : T extends AnnotationKind.METHOD
  ? BoundMethodAnnotationTarget<X>
  : T extends AnnotationKind.PROPERTY
  ? BoundPropertyAnnotationTarget<X>
  : never;
