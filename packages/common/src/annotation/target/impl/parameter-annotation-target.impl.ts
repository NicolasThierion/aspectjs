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
  ParameterAnnotationTarget,
} from '../annotation-target';
import {
  BOUND_INSTANCE_SYMBOL,
  BOUND_VALUE_SYMBOL,
  _AnnotationTargetImpl,
} from '../annotation-target.impl';
import { _ClassAnnotationTargetImpl } from './class-annotation-target.impl';
import { _MethodAnnotationTargetImpl } from './method-annotation-target.impl';

let _globalTargetId = 0;

export class _ParameterAnnotationTargetImpl<X>
  extends _AnnotationTargetImpl<AnnotationType.PARAMETER, X>
  implements ParameterAnnotationTarget<X>
{
  readonly propertyKey: string | symbol;
  readonly descriptor: MethodPropertyDescriptor;
  readonly parameterIndex: number;
  protected override [BOUND_INSTANCE_SYMBOL]?: X;
  protected override [BOUND_VALUE_SYMBOL]?: (...args: unknown[]) => unknown;

  private _declaringClassTarget?: ClassAnnotationTarget<X>;
  private _methodTarget?: MethodAnnotationTarget<X>;

  constructor(
    private readonly decoree: Prototype<X> | ConstructorType<X>,
    proto: Prototype<X>,
    propertyKey: string | symbol,
    descriptor: MethodPropertyDescriptor,
    parameterIndex: number,
    ref: AnnotationTargetRef,
    isStatic: boolean,
  ) {
    super(
      AnnotationType.PARAMETER,
      proto,
      argsNames(proto[propertyKey as any])[parameterIndex!] ??
        `#${parameterIndex!}`,
      `${isStatic ? 'static ' : ''}method ${proto.constructor.name}.${String(
        propertyKey,
      )}`,
      ref,
      isStatic,
    );
    this.propertyKey = propertyKey;
    this.descriptor = descriptor;
    this.parameterIndex = parameterIndex;
  }

  override defineMetadata(key: string, value: any): void {
    defineMetadata(key, value, this.proto, this.ref.toString());
  }
  override getMetadata<T extends unknown>(
    key: string,
    defaultvalue?: (() => T) | undefined,
  ): T {
    return getMetadata(key, this.proto, this.ref.toString(), defaultvalue);
  }

  static of<X>(
    decoree: Prototype<X> | ConstructorType<X>,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    assert(typeof decoree === 'object' || typeof decoree === 'function');
    assert(typeof propertyKey === 'string' || typeof propertyKey === 'symbol');
    assert(typeof parameterIndex === 'number');

    const proto = getPrototype(decoree);
    const isStatic = typeof decoree === 'function';

    const ref = `c[${proto.constructor.name}].${isStatic ? 's ' : ''}m[${String(
      propertyKey,
    )}].a[${parameterIndex}]`;

    const descriptor = Object.getOwnPropertyDescriptor(
      decoree,
      propertyKey,
    ) as MethodPropertyDescriptor;

    return getMetadata(
      `@ajs:tgrf`,
      decoree,
      ref,
      () =>
        new _ParameterAnnotationTargetImpl(
          decoree,
          proto,
          propertyKey,
          descriptor,
          parameterIndex,
          new AnnotationTargetRef(`${ref}#${_globalTargetId++}`),
          isStatic,
        ),
    );
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
  get parent(): MethodAnnotationTarget<X> {
    if (this._methodTarget) {
      return this._methodTarget;
    }

    const parentTarget = _MethodAnnotationTargetImpl.of(
      this.decoree,
      this.propertyKey,
      this.descriptor,
    );

    this._methodTarget = this[BOUND_INSTANCE_SYMBOL]
      ? parentTarget._bind(this[BOUND_INSTANCE_SYMBOL])
      : parentTarget;
    return this._methodTarget;
  }
  override get parentClass() {
    return this.declaringClass.parent;
  }

  override _bind(instance: X, args: unknown[]): ParameterAnnotationTarget<X> {
    if (this.static) {
      return this;
    }
    if (this[BOUND_INSTANCE_SYMBOL] === instance) {
      return this;
    }

    const bound = new _ParameterAnnotationTargetImpl(
      this.decoree,
      this.proto,
      this.propertyKey,
      this.descriptor,
      this.parameterIndex,
      this.ref,
      this.static,
    );

    bound[BOUND_INSTANCE_SYMBOL] = instance;
    bound[BOUND_VALUE_SYMBOL] = bound.proto[bound.propertyKey as any];

    if (args) {
      bound.eval = () => args[bound.parameterIndex];
    }

    return bound;
  }
}

function argsNames(func: unknown | ((...args: unknown[]) => unknown)) {
  assert(typeof func === 'function');
  return (func + '')
    .replace(/[/][/].*$/gm, '') // strip single-line comments
    .replace(/\s+/g, '') // strip white space
    .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments
    .split('){', 1)[0]!
    .replace(/^[^(]*[(]/, '') // extract the parameters
    .replace(/=[^,]+/g, '') // strip any ES6 defaults
    .split(',')
    .filter(Boolean); // split & filter [""]
}
