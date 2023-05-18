import { assert } from '@aspectjs/common/utils';
import { AnnotationRef } from './annotation-ref';
import { Annotation, TargetType } from './annotation.types';
import type { AnnotationTarget } from './target/annotation-target';

/**
 * Holds data about the execution context where the annotation is being invoked.
 */
export class AnnotationContext<T extends TargetType = TargetType, X = unknown> {
  /**
   * The reference to the annotation being invked.
   */
  public readonly ref: AnnotationRef;

  /**
   * @param ref @internal
   */
  constructor(
    /**
     * The annotation, or its reference, that is being invoked.
     */
    ref: Annotation | AnnotationRef,
    /**
     * The arguments passed to the annotation.
     */
    public readonly args: any[],
    /**
     * The target of the annotation.
     */
    public readonly target: AnnotationTarget<T, X>,
  ) {
    this.ref = AnnotationRef.of(ref);
  }

  /**
   *
   * @returns The signature of the annotation, in the form `@<groupId>:<name> on <target>`.
   */
  toString(): string {
    return `@${this.ref.groupId}:${this.ref.name} on ${this.target.label}`;
  }
}

/**
 * An {@link AnnotationContext} that can be bound to a value.
 * @internal
 */
export class BindableAnnotationContext<
  T extends TargetType = TargetType,
  X = unknown,
> extends AnnotationContext<T, X> {
  bind(
    instance: X,
    args?: T extends TargetType.PARAMETER ? unknown[] : never,
  ): BoundAnnotationContext<T, X> {
    let value: any;

    switch (this.target.type) {
      case TargetType.CLASS:
        value = instance;
        break;
      case TargetType.METHOD:
      case TargetType.PROPERTY:
        value = (instance as any)[this.target.propertyKey!];
        break;
      case TargetType.PARAMETER:
        if (!(args instanceof Array)) {
          throw new TypeError(
            'Expected annotation.bind() to receive an array of parameters',
          );
        } else if (args.length < this.target.parameterIndex) {
          throw new TypeError(
            `Cannot bind annotation ${this.ref} on parameter ${this.target.parameterIndex} : Received parameter array of length=${args.length}`,
          );
        }
        value = args[this.target.parameterIndex];
        break;
      default:
        assert(false);
    }
    return new BoundAnnotationContext(this, value);
  }
}

/**
 * An {@link AnnotationContext} bound to a value.
 * @param T The of the target of the annotation.
 * @param X The type of the class that contains the annotated symbol.
 */
export class BoundAnnotationContext<
  T extends TargetType = TargetType,
  X = unknown,
> extends AnnotationContext<T, X> {
  constructor(
    annotationContext: AnnotationContext<T, X>,
    /**
     * The value bound to the annotation.
     * - If the annotation is bound to a class, this is the class itself.
     * - If the annotation is bound to a method, this is the reference to the method.
     * - If the annotation is bound to a property, this is the value of the property.
     * - If the annotation is bound to a parameter, this is the value of the parameter.
     */
    public readonly value: unknown,
  ) {
    super(
      annotationContext.ref,
      annotationContext.args,
      annotationContext.target,
    );
    this.value = value;
  }
}
