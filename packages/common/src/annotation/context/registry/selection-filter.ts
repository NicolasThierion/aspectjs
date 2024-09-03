import { AnnotationType } from '../../annotation.types';
import { AnnotationTarget } from '../../target/annotation-target';

export type AnnotationSelectionFilter = {
  target: AnnotationTarget<AnnotationType, any>;

  /**
   * Which kind of annotation to select ?
   */
  types?: AnnotationType[];
};
