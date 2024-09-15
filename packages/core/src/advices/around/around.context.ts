import { AnnotationsByRefSelector } from '@aspectjs/common';
import type {
  PointcutKind,
  ToAnnotationKind,
} from '../../pointcut/pointcut-kind.type';
import type { AdviceTarget } from './../../advice/advice-target.type';
import type { JoinPoint } from './../../advice/joinpoint';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { AroundAdvice } from './around.type';

/**
 * Execution context passed to advices of type {@link AroundAdvice}
 */
export interface AroundContext<
  T extends PointcutKind = PointcutKind,
  X = object,
> {
  /** The annotation contexts **/
  readonly annotations: AnnotationsByRefSelector<
    ToAnnotationKind<T>
  >['annotations'];
  /** The 'this' instance bound to the current execution context **/
  readonly instance: X;
  /** the arguments originally passed to the joinpoint **/
  readonly args: unknown[];
  /** Hold the original function, bound to its execution context and it original parameters **/
  readonly joinpoint: JoinPoint;
  /** The symbol targeted by this advice (class, method, property or parameter **/
  readonly target: AdviceTarget<T, X>;
}
