import { AnnotationKind } from '../../annotation.types';
import { AnnotationTarget } from '../../target/annotation-target';

export type AnnotationSelectionFilter = {
  target: AnnotationTarget<AnnotationKind, any>;

  /**
   * Which kind of annotation to select ?
   */
  types?: AnnotationKind[];
};
