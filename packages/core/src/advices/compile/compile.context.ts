import type { AnnotationsByTypeSelection } from '@aspectjs/common';
import type { AdviceTarget } from './../../advice/advice-target.type';
import type {
  PointcutType,
  ToAnnotationType,
} from './../../pointcut/pointcut-target.type';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { CompileAdvice } from './compile.type';

/**
 * Execution context passed to advices of type {@link CompileAdvice}
 */
export interface CompileContext<
  T extends PointcutType = PointcutType,
  X = unknown,
> {
  /** The annotation contexts **/
  readonly annotations: AnnotationsByTypeSelection<ToAnnotationType<T>>;
  /** The symbol targeted by this advice (class, method, property or parameter **/
  readonly target: AdviceTarget<T, X>;

  readonly args: never;
}
