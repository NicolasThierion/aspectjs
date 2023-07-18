import { AnnotationsByTypeSelection } from '@aspectjs/common';
import type { JoinpointType } from '../../pointcut/pointcut-target.type';
import type { AdviceTarget } from './../../advice/advice.type';
import type { ToAnnotationType } from './../../pointcut/pointcut-target.type';

export interface AfterReturnContext<
  T extends JoinpointType = JoinpointType,
  X = unknown,
> {
  /** The annotation contexts **/
  readonly annotations: AnnotationsByTypeSelection<ToAnnotationType<T>, X>;
  /** The 'this' instance bound to the current execution context **/
  readonly instance: X;
  /** the arguments originally passed to the joinpoint **/
  readonly args: unknown[];
  /** The value originally returned by the joinpoint **/
  readonly value: unknown;
  /** The symbol targeted by this advice (class, method, property or parameter **/
  readonly target: AdviceTarget<T, X>;
}
