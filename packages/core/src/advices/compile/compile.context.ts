import type { AnnotationsByTypeSelection } from '@aspectjs/common';
import type { AdviceTarget } from './../../advice/advice.type';
import type {
  PointcutTargetType,
  ToTargetType,
} from './../../pointcut/pointcut-target.type';

export interface CompileContext<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> {
  /** The annotation contexts **/
  readonly annotations: AnnotationsByTypeSelection<ToTargetType<T>, X>;
  /** The symbol targeted by this advice (class, method, property or parameter **/
  readonly target: AdviceTarget<T, X>;

  readonly args: never;
}
