import { BoundAnnotationsByTypeSelection } from '@aspectjs/common';
import type { AdviceTarget } from './../../advice/advice-target.type';
import type {
  PointcutType,
  ToAnnotationType,
} from './../../pointcut/pointcut-target.type';
import type { BeforeAdvice } from './before.type';

/**
 * Execution context passed to advices of type {@link BeforeAdvice}
 */
export interface BeforeContext<
  T extends PointcutType = PointcutType,
  X = object,
> {
  /** The annotation contexts **/
  readonly annotations: BoundAnnotationsByTypeSelection<ToAnnotationType<T>>;
  /** The 'this' instance bound to the current execution context */
  readonly instance: T extends PointcutType.CLASS ? never : X;
  /** the arguments originally passed to the joinpoint */
  readonly args: unknown[];
  /** The symbol targeted by this advice (class, method, property or parameter */
  readonly target: AdviceTarget<T, X>;
}
