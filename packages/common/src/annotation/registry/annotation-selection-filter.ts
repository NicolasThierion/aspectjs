import { TargetType } from '../annotation.types';
import { AnnotationTarget } from '../target/annotation-target';

export type AnnotationSelectionFilter = {
  target: AnnotationTarget<TargetType, any>;

  /**
   * Which kind of annotation to select ?
   */
  types?: TargetType[];
};
