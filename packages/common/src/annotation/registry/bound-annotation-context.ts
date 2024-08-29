import { AnnotationContext } from '../annotation-context';
import { AnnotationStub, AnnotationType } from '../annotation.types';
import { BoundAnnotationTarget } from '../target/bound-annotation-target';

export interface BoundAnnotationContext<
  T extends AnnotationType = AnnotationType,
  S extends AnnotationStub = AnnotationStub,
  X = unknown,
> extends AnnotationContext<T, S, X> {
  readonly target: BoundAnnotationTarget<T, X>;
}
