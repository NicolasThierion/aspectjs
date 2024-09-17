/* eslint-disable @typescript-eslint/no-unused-vars */
import { AnnotationsByRefSelector } from '@aspectjs/common';
import type {
  PointcutKind,
  ToAnnotationKind,
} from '../../pointcut/pointcut-kind.type';
import type { AdviceTarget } from './../../advice/advice-target.type';

import type { AfterAdvice } from './after.type';
/**
 * Execution context passed to advices of type {@link AfterAdvice}
 */
export interface AfterContext<
  T extends PointcutKind = PointcutKind,
  X = object,
> {
  /** The annotations contexts **/
  readonly annotations: AnnotationsByRefSelector<
    ToAnnotationKind<T>
  >['annotations'];
  /** The 'this' instance bound to the current execution context **/
  readonly instance: X;
  /** the arguments originally passed to the joinpoint **/
  readonly args: any[];
  /** The symbol targeted by this advice (class, method, property or parameter **/
  readonly target: AdviceTarget<T, X>;
}
