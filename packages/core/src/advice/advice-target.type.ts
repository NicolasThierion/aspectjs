import type { AnnotationTarget } from '@aspectjs/common';
import type {
  JoinpointType,
  ToAnnotationType,
} from '../pointcut/pointcut-target.type';

export type AdviceTarget<
  T extends JoinpointType = JoinpointType,
  X = unknown,
> = AnnotationTarget<ToAnnotationType<T>, X>;
