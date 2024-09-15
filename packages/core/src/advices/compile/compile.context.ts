import type { AnnotationsByRefSelector } from '@aspectjs/common';
import type {
  PointcutKind,
  ToAnnotationKind,
} from '../../pointcut/pointcut-kind.type';
import type { AdviceTarget } from './../../advice/advice-target.type';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { CompileAdvice } from './compile.type';

/**
 * Execution context passed to advices of type {@link CompileAdvice}
 */
export interface CompileContext<
  T extends PointcutKind = PointcutKind,
  X = unknown,
> {
  /** The annotation contexts **/
  readonly annotations: AnnotationsByRefSelector<
    ToAnnotationKind<T>
  >['annotations'];
  /** The symbol targeted by this advice (class, method, property or parameter **/
  readonly target: AdviceTarget<T, X>;

  readonly args: never;
}
