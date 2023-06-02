import { AnnotationsByTypeSelection } from '@aspectjs/common';
import type { AdviceTarget } from './../../advice/advice.type';
import type {
  PointcutTargetType,
  ToTargetType,
} from './../../pointcut/pointcut-target.type';

export interface AfterContext<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> {
  /** The annotations contexts **/
  readonly annotations: AnnotationsByTypeSelection<ToTargetType<T>, X>;
  /** The 'this' instance bound to the current execution context **/
  readonly instance: T;
  /** the arguments originally passed to the joinpoint **/
  readonly args: any[];
  /** The symbol targeted by this advice (class, method, property or parameter **/
  readonly target: AdviceTarget<T, X>;
}
