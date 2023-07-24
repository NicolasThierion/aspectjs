import { Prototype } from '@aspectjs/common/utils';
import { AnnotationType } from '../annotation.types';
import {
  AnnotationTarget,
  AnnotationTargetRef,
  BaseAnnotationTarget,
  ClassAnnotationTarget,
} from './annotation-target';

export const BOUND_INSTANCE_SYMBOL = Symbol.for('boundInstance');
/**
 * @internal
 */
export abstract class _AnnotationTargetImpl<
  T extends AnnotationType = AnnotationType,
  X = unknown,
> implements BaseAnnotationTarget<T, X>
{
  public abstract readonly declaringClass: ClassAnnotationTarget<X>;
  public abstract readonly parentClass:
    | ClassAnnotationTarget<unknown>
    | undefined;

  protected readonly [BOUND_INSTANCE_SYMBOL]?: X;
  public readonly value?: unknown;

  constructor(
    public readonly type: T,
    public readonly proto: Prototype<X>,
    public readonly name: string,
    public readonly label: string,
    public readonly ref: AnnotationTargetRef,
  ) {}
  toString() {
    return (this as any as AnnotationTarget).label;
  }

  abstract bind(instance: unknown, value?: unknown): AnnotationTarget<T, X>;
}
