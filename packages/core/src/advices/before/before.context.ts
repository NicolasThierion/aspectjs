import { BoundAnnotationsByTypeSelection } from '@aspectjs/common';
import type { AdviceTarget } from './../../advice/advice-target.type';
import type {
  JoinpointType,
  ToAnnotationType,
} from './../../pointcut/pointcut-target.type';
export interface BeforeContext<
  T extends JoinpointType = JoinpointType,
  X = object,
> {
  /** The annotation contexts **/
  readonly annotations: BoundAnnotationsByTypeSelection<ToAnnotationType<T>>;
  /** The 'this' instance bound to the current execution context */
  readonly instance: T extends JoinpointType.CLASS ? never : X;
  /** the arguments originally passed to the joinpoint */
  readonly args: unknown[];
  /** The symbol targeted by this advice (class, method, property or parameter */
  readonly target: AdviceTarget<T, X>;
}
