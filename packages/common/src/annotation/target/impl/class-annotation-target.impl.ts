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
} from '../annotation-target';
import {
  BOUND_INSTANCE_SYMBOL,
  BOUND_VALUE_SYMBOL,
  _AnnotationTargetImpl,
} from '../annotation-target.impl';

let _globalTargetId = 0;

export class _ClassAnnotationTargetImpl<X = unknown>
  extends _AnnotationTargetImpl<AnnotationKind.CLASS, X>
  implements ClassAnnotationTarget<X>
{
  protected declare [BOUND_INSTANCE_SYMBOL]?: X;
  protected declare [BOUND_VALUE_SYMBOL]?: X;
  private _parentClass?: ClassAnnotationTarget;

  private constructor(proto: Prototype<X>, ref: AnnotationTargetRef) {
    super(
      AnnotationKind.CLASS,
      proto,
      proto.constructor.name,
      `class ${proto.constructor.name}`,
      ref,
    );
  }

  get value() {
    return this.proto;
  }

  override defineMetadata(key: string, value: any): void {
    defineMetadata(key, value, this.proto);
  }
  override getMetadata<T>(
    key: string,
    defaultvalue?: (() => T) | undefined,
  ): T {
    return getMetadata(key, this.proto, defaultvalue);
  }

  static of<X>(decoree: ConstructorType<X>) {
    assert(typeof decoree === 'function');

    const proto = getPrototype(decoree);
    const ref = `c[${decoree.name}]`;
    return getMetadata(
      `@ajs:tgrf`,
      proto,
      ref,
      () =>
        new _ClassAnnotationTargetImpl<X>(
          proto,
          new AnnotationTargetRef(`${ref}#${_globalTargetId++}`),
        ),
    );
  }

  asDecoratorArgs() {
    return [this.proto.constructor];
  }

  public get declaringClass() {
    return this;
  }

  override get parentClass(): ClassAnnotationTarget | undefined {
    if (this._parentClass) {
      return this._parentClass;
    }

    const parentProto = Object.getPrototypeOf(this.proto);

    if (!parentProto || parentProto === Object.prototype) {
      // no parent
      return undefined;
    }

    const parentClass = _ClassAnnotationTargetImpl.of(parentProto.constructor);

    if (parentClass && typeof this[BOUND_INSTANCE_SYMBOL] !== 'undefined') {
      return (parentClass as _ClassAnnotationTargetImpl)._bind(
        this[BOUND_INSTANCE_SYMBOL]!,
      );
    }

    this._parentClass = parentClass;
    return parentClass;
  }

  override _bind(instance: X): ClassAnnotationTarget<X> {
    if (this[BOUND_INSTANCE_SYMBOL] === instance) {
      return this;
    }

    const bound = new _ClassAnnotationTargetImpl(this.proto, this.ref);
    bound[BOUND_INSTANCE_SYMBOL] = instance;
    bound[BOUND_VALUE_SYMBOL] = instance;
    return bound;
  }
}
