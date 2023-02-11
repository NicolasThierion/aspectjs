import type { AnnotationContext } from '../annotation-context';
import type { AnnotationRef } from '../annotation-ref';
import type { Annotation, TargetType } from '../annotation.types';
import type { AnnotationTarget } from '../target/annotation-target';

/**
 * @internal
 */
export type AnnotationTriggerFn = (
  annotationContext: AnnotationContext,
) => void;

/**
 * For a given class, typescript decorators are evaluated from the inner to the outer.
 * Eg: parameter decorators > property decorators > class decorators.
 * For this reason, higer inner decorators cannot rely on outer decorators.
 * This class allows moving the behavior of an inner decorator into a trigger,
 * that can later be called when the decorator is effectively applied.
 * @internal
 *
 */
export interface AnnotationTrigger {
  targets: (AnnotationTarget | TargetType)[];
  annotations: (AnnotationRef | Annotation)[];
  order?: number;
  fn: AnnotationTriggerFn;
}
