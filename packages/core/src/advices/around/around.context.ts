import type { BoundAnnotationContext } from '@aspectjs/common';
import type { AdviceTarget } from './../../advice/advice.type';
import type { JoinPoint } from './../../advice/joinpoint';
import type {
  PointcutTargetType,
  ToTargetType,
} from './../../pointcut/pointcut-target.type';

export interface AroundContext<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> {
  /** The annotation contexts **/
  readonly annotations: Array<BoundAnnotationContext<ToTargetType<T>, X>>;
  /** The 'this' instance bound to the current execution context **/
  readonly instance: X;
  /** the arguments originally passed to the joinpoint **/
  readonly args: unknown[];
  /** Hold the original function, bound to its execution context and it original parameters **/
  readonly joinpoint: JoinPoint;
  /** The symbol targeted by this advice (class, method, property or parameter **/
  readonly target: AdviceTarget<T, X>;
  /** The value originally returned by the joinpoint **/
  readonly value: unknown;
}
