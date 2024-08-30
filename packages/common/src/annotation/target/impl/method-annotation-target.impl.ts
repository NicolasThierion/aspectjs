import {
  ConstructorType,
  MethodPropertyDescriptor,
  Prototype,
  assert,
  defineMetadata,
  getMetadata,
  getPrototype,
} from '@aspectjs/common/utils';
import { AnnotationType } from '../../annotation.types';
import {
  AnnotationTargetRef,
  ClassAnnotationTarget,
  MethodAnnotationTarget,
} from '../annotation-target';
import {
  BOUND_INSTANCE_SYMBOL,
  BOUND_VALUE_SYMBOL,
  _AnnotationTargetImpl,
} from '../annotation-target.impl';
import { _ClassAnnotationTargetImpl } from './class-annotation-target.impl';

let _globalTargetId = 0;

export class _MethodAnnotationTargetImpl<X>
  extends _AnnotationTargetImpl<AnnotationType.METHOD, X>
  implements MethodAnnotationTarget<X>
{
  readonly propertyKey: string | symbol;
  readonly descriptor: MethodPropertyDescriptor;
  protected declare [BOUND_INSTANCE_SYMBOL]?: X;
  protected declare [BOUND_VALUE_SYMBOL]?: (...args: unknown[]) => unknown;

  private _declaringClassTarget?: ClassAnnotationTarget<X>;

  private constructor(
    proto: Prototype<X>,
    propertyKey: string | symbol,
    descriptor: MethodPropertyDescriptor,
    ref: AnnotationTargetRef,
    isStatic: boolean,
  ) {
    super(
      AnnotationType.METHOD,
      proto,
      String(propertyKey),
      `${isStatic ? 'static ' : ''}method ${proto.constructor.name}.${String(
        propertyKey,
      )}`,
      ref,
      isStatic,
    );
    this.propertyKey = propertyKey;
    this.descriptor = descriptor;
  }

  override defineMetadata(key: string, value: any): void {
    defineMetadata(key, value, this.proto, this.propertyKey);
  }
  override getMetadata<T extends unknown>(
    key: string,
    defaultvalue?: (() => T) | undefined,
  ): T {
    return getMetadata(key, this.proto, this.propertyKey, defaultvalue);
  }

  static of<X>(
    decoree: Prototype<X> | ConstructorType<X>,
    propertyKey: string | symbol,
    descriptor: MethodPropertyDescriptor,
  ) {
    assert(typeof decoree === 'object' || typeof decoree === 'function');
    assert(typeof propertyKey === 'string' || typeof propertyKey === 'symbol');
    assert(typeof descriptor === 'object');

    const proto = getPrototype(decoree);
    const isStatic = typeof decoree === 'function';

    const ref = `c[${proto.constructor.name}].${isStatic ? 's ' : ''}m[${String(
      propertyKey,
    )}]`;

    return getMetadata(
      `@ajs:tgrf`,
      decoree,
      ref,
      () =>
        new _MethodAnnotationTargetImpl(
          proto,
          propertyKey,
          descriptor,
          new AnnotationTargetRef(`${ref}#${_globalTargetId++}`),
          isStatic,
        ),
    );
  }

  asDecoratorArgs() {
    return [this.proto, this.propertyKey, this.descriptor];
  }

  get declaringClass() {
    if (this._declaringClassTarget) {
      return this._declaringClassTarget;
    }

    const classTarget = _ClassAnnotationTargetImpl.of<X>(
      this.proto.constructor,
    );
    this._declaringClassTarget = this[BOUND_INSTANCE_SYMBOL]
      ? classTarget._bind(this[BOUND_INSTANCE_SYMBOL])
      : classTarget;

    return this._declaringClassTarget;
  }
  get parent() {
    return this.declaringClass;
  }
  override get parentClass() {
    return this.declaringClass.parent;
  }

  override _bind(instance: X): MethodAnnotationTarget<X> {
    if (this.static) {
      return this;
    }
    if (this[BOUND_INSTANCE_SYMBOL] === instance) {
      return this;
    }
    const bound = new _MethodAnnotationTargetImpl(
      this.proto,
      this.propertyKey,
      this.descriptor,
      this.ref,
      this.static,
    );

    bound[BOUND_INSTANCE_SYMBOL] = instance;
    bound[BOUND_VALUE_SYMBOL] = bound.proto[bound.propertyKey as any];
    return bound;
  }
}
