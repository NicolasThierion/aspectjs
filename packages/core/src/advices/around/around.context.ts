import { BoundAnnotationsByTypeSelection } from '@aspectjs/common';
import type { AdviceTarget } from './../../advice/advice-target.type';
import type { JoinPoint } from './../../advice/joinpoint';
import type {
  PointcutType,
  ToAnnotationType,
} from './../../pointcut/pointcut-target.type';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { AroundAdvice } from './around.type';

/**
 * Execution context passed to advices of type {@link AroundAdvice}
 */
export interface AroundContext<
  T extends PointcutType = PointcutType,
  X = object,
> {
  /** The annotation contexts **/
  readonly annotations: BoundAnnotationsByTypeSelection<ToAnnotationType<T>>;
  /** The 'this' instance bound to the current execution context **/
  readonly instance: X;
  /** the arguments originally passed to the joinpoint **/
  readonly args: unknown[];
  /** Hold the original function, bound to its execution context and it original parameters **/
  readonly joinpoint: JoinPoint;
  /** The symbol targeted by this advice (class, method, property or parameter **/
  readonly target: AdviceTarget<T, X>;
}
