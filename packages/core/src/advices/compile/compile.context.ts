import type { AnnotationsByTypeSelection } from '@aspectjs/common';
import type { AdviceTarget } from './../../advice/advice-target.type';
import type {
  JoinpointType,
  ToAnnotationType,
} from './../../pointcut/pointcut-target.type';

export interface CompileContext<
  T extends JoinpointType = JoinpointType,
  X = unknown,
> {
  /** The annotation contexts **/
  readonly annotations: AnnotationsByTypeSelection<ToAnnotationType<T>, X>;
  /** The symbol targeted by this advice (class, method, property or parameter **/
  readonly target: AdviceTarget<T, X>;

  readonly args: never;
}
