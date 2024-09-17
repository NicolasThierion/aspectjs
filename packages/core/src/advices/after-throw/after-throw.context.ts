/* eslint-disable @typescript-eslint/no-unused-vars */
import { AnnotationsByRefSelector } from '@aspectjs/common';
import type {
  PointcutKind,
  ToAnnotationKind,
} from '../../pointcut/pointcut-kind.type';
import type { AdviceTarget } from './../../advice/advice-target.type';

import type { AfterThrowAdvice } from './after-throw.type';

/**
 * Execution context passed to advices of type {@link AfterThrowAdvice}
 */
export interface AfterThrowContext<
  T extends PointcutKind = PointcutKind,
  X = unknown,
> {
  /** The annotation contexts **/
  readonly annotations: AnnotationsByRefSelector<
    ToAnnotationKind<T>
  >['annotations'];
  /** The 'this' instance bound to the current execution context **/
  readonly instance: X;
  /** the arguments originally passed to the joinpoint **/
  readonly args: unknown[];
  /** The error originally thrown by the joinpoint **/
  readonly error: Error | unknown;
  /** The symbol targeted by this advice (class, method, property or parameter **/
  readonly target: AdviceTarget<T, X>;
}
