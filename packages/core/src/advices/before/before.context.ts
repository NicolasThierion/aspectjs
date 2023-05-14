import type { BoundAnnotationContext } from '@aspectjs/common';
import type { AdviceTarget } from './../../advice/advice.type';
import type {
  PointcutTargetType,
  ToTargetType,
} from './../../pointcut/pointcut-target.type';
export interface BeforeContext<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> {
  /** The annotation contexts */
  readonly annotations: Array<BoundAnnotationContext<ToTargetType<T>, X>>;
  /** The 'this' instance bound to the current execution context */
  readonly instance: T extends PointcutTargetType.CLASS ? never : X;
  /** the arguments originally passed to the joinpoint */
  readonly args: unknown[];
  /** The symbol targeted by this advice (class, method, property or parameter */
  readonly target: AdviceTarget<T, X>;
}
