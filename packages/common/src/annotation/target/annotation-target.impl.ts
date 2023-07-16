import { Prototype } from '@aspectjs/common/utils';
import { AnnotationType } from '../annotation.types';
import {
  AnnotationTarget,
  AnnotationTargetRef,
  BaseAnnotationTarget,
  ClassAnnotationTarget,
} from './annotation-target';

export const BOUND_INSTANCE_SYMBOL = Symbol.for('@ajs:boundInstance');
export const BOUND_VALUE_SYMBOL = Symbol.for('@ajs:boundValue');
const NOT_BOUND = {};
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
  protected readonly [BOUND_VALUE_SYMBOL]?: unknown = NOT_BOUND;

  public readonly ['static']: boolean;

  eval(): unknown {
    if (this[BOUND_VALUE_SYMBOL] === NOT_BOUND) {
      throw new Error('AnnotationTarget is not bound to a value');
    }

    return this[BOUND_VALUE_SYMBOL];
  }

  constructor(
    public readonly type: T,
    public readonly proto: Prototype<X>,
    public readonly name: string,
    public readonly label: string,
    public readonly ref: AnnotationTargetRef,
    staticAttribute: boolean = false,
  ) {
    this['static'] = staticAttribute;
  }
  abstract defineMetadata(key: string, value: any): void;
  abstract getMetadata<T extends unknown>(
    key: string,
    defaultvalue?: (() => T) | undefined,
  ): T;

  toString() {
    return (this as any as AnnotationTarget).label;
  }

  /**
   * Binds a value to this AnnotationTarget. The value is either the class instance for ClassAnnotationTarget, the property value for PropertyAnnotationTarget, MethodAnnotationTarget or ParameterAnnotationTarget.
   * In addition, in case of ParameterAnnotationTarget, the bind() method accepts a 2nd argument to bind the parameter value.
   *
   * @param instance The class instance to bind this target to.
   * @param value the value of this target
   */
  abstract _bind(instance: X, args?: unknown[]): AnnotationTarget<T, X>;
}
