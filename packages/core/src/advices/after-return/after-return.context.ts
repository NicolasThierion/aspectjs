import { AnnotationsByRefSelector } from '@aspectjs/common';
import type {
  PointcutType,
  ToAnnotationType,
} from '../../pointcut/pointcut-target.type';
import type { AdviceTarget } from './../../advice/advice-target.type';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { AfterReturnAdvice } from './after-return.type';

/**
 * Execution context passed to advices of type {@link AfterReturnAdvice}
 */
export interface AfterReturnContext<
  T extends PointcutType = PointcutType,
  X = unknown,
> {
  /** The annotation contexts **/
  readonly annotations: AnnotationsByRefSelector<
    ToAnnotationType<T>
  >['annotations'];

  /** The 'this' instance bound to the current execution context **/
  readonly instance: X;
  /** the arguments originally passed to the joinpoint **/
  readonly args: unknown[];
  /** The value originally returned by the joinpoint **/
  readonly value: unknown;
  /** The symbol targeted by this advice (class, method, property or parameter **/
  readonly target: AdviceTarget<T, X>;
}
