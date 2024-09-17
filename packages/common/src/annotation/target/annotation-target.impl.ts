import { Prototype } from '@aspectjs/common/utils';
import { AnnotationRef } from '../annotation-ref';
import {
  Annotation,
  AnnotationKind,
  AnnotationStub,
} from '../annotation.types';
import { getAnnotations } from '../context/annotations.global';
import { AnnotationsSelector } from '../context/registry/selector';
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
  T extends AnnotationKind = AnnotationKind,
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
    public readonly kind: T,
    public readonly proto: Prototype<X>,
    public readonly name: string,
    public readonly label: string,
    public readonly ref: AnnotationTargetRef,
    staticAttribute: boolean = false,
  ) {
    this['static'] = staticAttribute;
  }

  annotations<
    T extends AnnotationKind,
    S extends AnnotationStub = AnnotationStub,
  >(annotation: S): AnnotationsSelector<T, S>;
  annotations(
    ...annotation: (Annotation | AnnotationRef | string)[]
  ): AnnotationsSelector<AnnotationKind, AnnotationStub>;
  annotations(
    ...annotations: (Annotation | AnnotationRef | string)[]
  ): AnnotationsSelector<AnnotationKind, AnnotationStub> {
    const propertyTarget =
      this as unknown as AnnotationTarget<AnnotationKind.PROPERTY>;
    const methodTarget =
      this as unknown as AnnotationTarget<AnnotationKind.METHOD>;
    const parameterTarget =
      this as unknown as AnnotationTarget<AnnotationKind.PARAMETER>;
    switch (this.kind) {
      case AnnotationKind.CLASS:
        return getAnnotations(...annotations).onClass(this.proto.constructor);
      case AnnotationKind.PROPERTY:
        return getAnnotations(...annotations).onProperty(
          this.proto,
          propertyTarget.propertyKey as any,
        );
      case AnnotationKind.METHOD:
        return getAnnotations(...annotations).onMethod(
          methodTarget.proto,
          methodTarget.propertyKey as any,
        );
      case AnnotationKind.PARAMETER:
        return getAnnotations(...annotations).onParameter(
          parameterTarget.proto,
          parameterTarget.propertyKey as any,
          parameterTarget.parameterIndex,
        );

      default:
        throw new TypeError(`unknown annotation target kind: ${this.kind}`);
    }
  }
  abstract asDecoratorArgs(): any[];

  abstract defineMetadata(key: string, value: any): void;
  abstract getMetadata<T>(
    key: string,
    defaultvalue?: (() => T) | undefined,
  ): T | undefined;

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
