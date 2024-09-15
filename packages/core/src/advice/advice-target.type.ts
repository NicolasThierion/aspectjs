import type { AnnotationTarget } from '@aspectjs/common';
import type {
  PointcutKind,
  ToAnnotationKind,
} from '../pointcut/pointcut-kind.type';

export type AdviceTarget<
  T extends PointcutKind = PointcutKind,
  X = unknown,
> = AnnotationTarget<ToAnnotationKind<T>, X> & {
  eval(): T extends PointcutKind.PARAMETER ? never : unknown;
};
