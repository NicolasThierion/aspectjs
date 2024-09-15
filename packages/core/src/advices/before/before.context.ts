import { AnnotationsByRefSelector } from '@aspectjs/common';
import type {
  PointcutKind,
  ToAnnotationKind,
} from '../../pointcut/pointcut-kind.type';
import type { AdviceTarget } from './../../advice/advice-target.type';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { BeforeAdvice } from './before.type';

/**
 * Execution context passed to advices of type {@link BeforeAdvice}
 */
export interface BeforeContext<
  T extends PointcutKind = PointcutKind,
  X = object,
> {
  /** The annotation contexts **/
  readonly annotations: AnnotationsByRefSelector<
    ToAnnotationKind<T>
  >['annotations'];
  /** The 'this' instance bound to the current execution context */
  readonly instance: T extends PointcutKind.CLASS ? never : X;
  /** the arguments originally passed to the joinpoint */
  readonly args: unknown[];
  /** The symbol targeted by this advice (class, method, property or parameter */
  readonly target: AdviceTarget<T, X>;
}
