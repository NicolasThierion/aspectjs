import {
  ConstructorType,
  Prototype,
  assert,
  defineMetadata,
  getMetadata,
  getPrototype,
} from '@aspectjs/common/utils';
import { AnnotationKind } from '../../annotation.types';
import {
  AnnotationTargetRef,
  ClassAnnotationTarget,
  PropertyAnnotationTarget,
} from '../annotation-target';
import {
  BOUND_INSTANCE_SYMBOL,
  BOUND_VALUE_SYMBOL,
  _AnnotationTargetImpl,
} from '../annotation-target.impl';
import { defuseAdvices } from '../annotation-target.utils';
import { _ClassAnnotationTargetImpl } from './class-annotation-target.impl';

let _globalTargetId = 0;

export class _PropertyAnnotationTargetImpl<X>
  extends _AnnotationTargetImpl<AnnotationKind.PROPERTY, X>
  implements PropertyAnnotationTarget<X>
{
  override defineMetadata(key: string, value: any): void {
    defineMetadata(key, value, this.proto, this.propertyKey);
  }
  override getMetadata<T extends unknown>(
    key: string,
    defaultvalue?: (() => T) | undefined,
  ): T {
    return getMetadata(key, this.proto, this.propertyKey, defaultvalue);
  }

  readonly propertyKey: string | symbol;
  readonly descriptor: PropertyDescriptor;
  protected declare [BOUND_INSTANCE_SYMBOL]?: X;
  protected declare [BOUND_VALUE_SYMBOL]?: () => unknown;

  private _declaringClassTarget?: ClassAnnotationTarget<X>;
  private constructor(
    proto: Prototype<X>,
    propertyKey: string | symbol,
    ref: AnnotationTargetRef,
    descriptor: PropertyDescriptor,
    isStatic: boolean,
  ) {
    super(
      AnnotationKind.PROPERTY,
      proto,
      String(propertyKey),
      `${isStatic ? 'static ' : ''}property ${proto.constructor.name}.${String(
        propertyKey,
      )}`,
      ref,
      isStatic,
    );

    this.propertyKey = propertyKey;
    this.descriptor = descriptor;
  }

  static of<X>(
    decoree: Prototype<X> | ConstructorType<X>,
    propertyKey: string | symbol,
    descriptor?: PropertyDescriptor,
  ) {
    assert(typeof decoree === 'object' || typeof decoree === 'function');
    assert(typeof propertyKey === 'string' || typeof propertyKey === 'symbol');
    assert(typeof descriptor === 'object' || typeof descriptor === 'undefined');
    const proto = getPrototype(decoree);

    // const descriptor = Object.getOwnPropertyDescriptor(
    //   targetArgs.decoree,
    //   targetArgs.propertyKey!,
    // )!;

    const isStatic = typeof decoree === 'function';
    const ref = `c[${proto.constructor.name}].${isStatic ? 's ' : ''}p[${String(
      propertyKey,
    )}]`;

    return getMetadata(
      `@ajs:tgrf`,
      decoree,
      ref,
      () =>
        new _PropertyAnnotationTargetImpl(
          proto,
          propertyKey,
          new AnnotationTargetRef(`${ref}#${_globalTargetId++}`),
          descriptor ?? Object.getOwnPropertyDescriptor(decoree, propertyKey)!,
          isStatic,
        ),
    );
  }

  asDecoratorArgs() {
    return [this.proto, this.propertyKey];
  }

  get declaringClass() {
    if (this._declaringClassTarget) {
      return this._declaringClassTarget;
    }

    const declaringClassTarget = _ClassAnnotationTargetImpl.of<X>(
      this.proto.constructor,
    );
    this._declaringClassTarget =
      typeof this[BOUND_INSTANCE_SYMBOL] !== 'undefined'
        ? declaringClassTarget._bind(this[BOUND_INSTANCE_SYMBOL])
        : declaringClassTarget;

    return this._declaringClassTarget;
  }

  get parentClass() {
    return this.declaringClass.parentClass;
  }

  override eval(): unknown {
    const getter = super.eval() as any;
    return defuseAdvices(this, getter);
  }

  override _bind(instance: X): PropertyAnnotationTarget<X> {
    if (this.static) {
      return this;
    }
    if (this[BOUND_INSTANCE_SYMBOL] === instance) {
      return this;
    }
    const bound = new _PropertyAnnotationTargetImpl(
      this.proto,
      this.propertyKey,
      this.ref,
      this.descriptor,
      this.static,
    );

    bound[BOUND_INSTANCE_SYMBOL] = instance;
    bound[BOUND_VALUE_SYMBOL] = () => (instance as any)[this.propertyKey];
    return bound;
  }
}
