import type { AnnotationTarget } from '@aspectjs/common';
import type {
  PointcutType,
  ToAnnotationType,
} from '../pointcut/pointcut-target.type';

export type AdviceTarget<
  T extends PointcutType = PointcutType,
  X = unknown,
> = AnnotationTarget<ToAnnotationType<T>, X> & {
  eval(): T extends PointcutType.PARAMETER ? never : unknown;
};
