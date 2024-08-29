import { Annotation, AnnotationsSelector } from '@aspectjs/common';
import type { AdviceTarget } from './../../advice/advice-target.type';
import type {
  PointcutType,
  ToAnnotationType,
} from './../../pointcut/pointcut-target.type';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { AfterThrowAdvice } from './after-throw.type';

/**
 * Execution context passed to advices of type {@link AfterThrowAdvice}
 */
export interface AfterThrowContext<
  T extends PointcutType = PointcutType,
  X = unknown,
> {
  /** The annotation contexts **/
  readonly annotations: (
    ...annotations: Annotation[]
  ) => AnnotationsSelector<ToAnnotationType<T>>;
  /** The 'this' instance bound to the current execution context **/
  readonly instance: X;
  /** the arguments originally passed to the joinpoint **/
  readonly args: unknown[];
  /** The error originally thrown by the joinpoint **/
  readonly error: Error | unknown;
  /** The symbol targeted by this advice (class, method, property or parameter **/
  readonly target: AdviceTarget<T, X>;
}
