import { AnnotationKind, AnnotationTarget } from '@aspectjs/common';

export type _BindableAnnotationTarget<
  T extends AnnotationKind = AnnotationKind,
  X = unknown,
> = AnnotationTarget<T, X> & {
  /**
   * Binds a value to this AnnotationTarget. The value is either the class instance for ClassAnnotationTarget, the property value for PropertyAnnotationTarget, MethodAnnotationTarget or ParameterAnnotationTarget.
   * In addition, in case of ParameterAnnotationTarget, the bind() method accepts a 2nd argument to bind the parameter value.
   *
   * @param instance The class instance to bind this target to.
   * @param value If target is a ParameterAnnotationTarget, args is the array of parameters given to the currently called function
   */
  _bind(instance: X, args?: unknown[]): AnnotationTarget<T, X>;
};
