import { AnnotationContext } from '../../annotation-context';
import { AnnotationKind, AnnotationStub } from '../../annotation.types';
import { BoundAnnotationTarget } from '../../target/bound-annotation-target';

export interface BoundAnnotationContext<
  T extends AnnotationKind = AnnotationKind,
  S extends AnnotationStub = AnnotationStub,
  X = unknown,
> extends AnnotationContext<T, S, X> {
  readonly target: BoundAnnotationTarget<T, X>;
}
