import { AnnotationRef } from './annotation-ref';
import { Annotation, AnnotationKind, AnnotationStub } from './annotation.types';
import type { AnnotationTarget } from './target/annotation-target';

/**
 * Holds data about the execution context where the annotation is being invoked.
 */
export class AnnotationContext<
  T extends AnnotationKind = AnnotationKind,
  S extends AnnotationStub = AnnotationStub,
  X = unknown,
> {
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
    public readonly args: Parameters<S>,
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
