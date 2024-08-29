import { AnnotationsByRefSelector } from '@aspectjs/common';
import type { AdviceTarget } from './../../advice/advice-target.type';
import type {
  PointcutType,
  ToAnnotationType,
} from './../../pointcut/pointcut-target.type';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { AfterAdvice } from './after.type';
/**
 * Execution context passed to advices of type {@link AfterAdvice}
 */
export interface AfterContext<
  T extends PointcutType = PointcutType,
  X = object,
> {
  /** The annotations contexts **/
  readonly annotations: AnnotationsByRefSelector<
    ToAnnotationType<T>
  >['annotations'];
  /** The 'this' instance bound to the current execution context **/
  readonly instance: X;
  /** the arguments originally passed to the joinpoint **/
  readonly args: any[];
  /** The symbol targeted by this advice (class, method, property or parameter **/
  readonly target: AdviceTarget<T, X>;
}
