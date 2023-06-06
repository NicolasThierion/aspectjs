import {
  assert,
  ConstructorType,
  getMetadata,
  isUndefined,
} from '@aspectjs/common/utils';

import { TargetType } from '../annotation.types';
import {
  AnnotationTarget,
  AnnotationTargetRef,
  ClassAnnotationTarget,
  MethodAnnotationTarget,
  MethodPropertyDescriptor,
  ParameterAnnotationTarget,
  PropertyAnnotationTarget,
  Prototype,
} from './annotation-target';
import { DecoratorTargetArgs } from './target-args';

let _globalTargetId = 0;
let _factoryId = 0;

/**
 * Create {@link AnnotationTarget}
 */
export class AnnotationTargetFactory {
  private readonly id = _factoryId++;

  private readonly _REF_GENERATORS = {
    [TargetType.CLASS]: (d: DecoratorTargetArgs) => {
      const ref = `c[${d.proto.constructor.name}]`;

      return getMetadata(
        `aspectjs.targetFactory#${this.id}:${ref}`,
        d.proto,
        () => new AnnotationTargetRef(`${ref}#${_globalTargetId++}`),
      );
    },
    [TargetType.PROPERTY]: (d: DecoratorTargetArgs) => {
      const ref = `c[${d.proto.constructor.name}].p[${d.propertyKey}]`;
      return getMetadata(
        `aspectjs.targetFactory#${this.id}:${ref}`,
        this._REF_GENERATORS[TargetType.CLASS](d),
        () => new AnnotationTargetRef(`${ref}#${_globalTargetId++}`),
      );
    },
    [TargetType.METHOD]: (d: DecoratorTargetArgs) => {
      const ref = `c[${d.proto.constructor.name}].m[${d.propertyKey}]`;
      return getMetadata(
        `aspectjs.targetFactory#${this.id}:${ref}`,
        this._REF_GENERATORS[TargetType.CLASS](d),
        () => new AnnotationTargetRef(`${ref}#${_globalTargetId++}`),
      );
    },
    [TargetType.PARAMETER]: (d: DecoratorTargetArgs) => {
      const ref = `c[${d.proto.constructor.name}].m[${d.propertyKey}].a[${d.parameterIndex}]`;
      return getMetadata(
        `aspectjs.targetFactory#${this.id}:${ref}`,
        this._REF_GENERATORS[TargetType.CLASS](d),
        () => new AnnotationTargetRef(`${ref}#${_globalTargetId++}`),
      );
    },
  };

  private _findOrCreate<T extends TargetType = TargetType, X = unknown>(
    ref: AnnotationTargetRef,
    decoratorArgs: DecoratorTargetArgs<T>,
    save: boolean,
  ): AnnotationTarget<T, X> {
    return getMetadata(
      ref.value,
      decoratorArgs.proto,
      () => {
        return _TARGET_GENERATORS[decoratorArgs.type](this, decoratorArgs, ref);
      },
      save,
    ) as AnnotationTarget<T, X>;
  }

  get<T extends TargetType = TargetType, X = unknown>(
    decoratorArgs: DecoratorTargetArgs<T>,
  ): AnnotationTarget<T, X>;
  get<T extends TargetType = TargetType, X = unknown>(
    decoratorArgs: DecoratorTargetArgs<T>,
  ): AnnotationTarget<T, X> {
    return this._findOrCreate(
      this._REF_GENERATORS[decoratorArgs.type](decoratorArgs),
      decoratorArgs,
      true,
    );
  }

  of<T extends TargetType = TargetType.CLASS, X = unknown>(
    target: ConstructorType<X>,
  ): AnnotationTarget<T, X>;

  of<T extends TargetType = TargetType, X = unknown>(
    target: Prototype<X>,
    propertyKey: string | symbol,
  ): AnnotationTarget<T, X>;

  of<T extends TargetType = TargetType, X = unknown>(
    target: Prototype<X>,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): AnnotationTarget<T, X>;

  of<T extends TargetType = TargetType, X = unknown>(
    target: Prototype<X>,
    propertyKey: string | symbol,
    parameterIndex: number,
  ): AnnotationTarget<T, X>;

  of<T extends TargetType = TargetType, X = unknown>(
    ...args: unknown[]
  ): AnnotationTarget<T, X>;

  of<T extends TargetType = TargetType, X = unknown>(
    ...args: unknown[]
  ): AnnotationTarget<T, X> {
    // ClassAnnotation = <TFunction extends Function>(target: TFunction) => TFunction | void;
    // PropertyAnnotation = (target: Object, propertyKey: string | symbol) => void;
    // MethodAnnotation = <A>(target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<A>) => TypedPropertyDescriptor<A> | void;
    // ParameterAnnotation = (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;

    return this.get(DecoratorTargetArgs.of(args));
  }
}

const _TARGET_GENERATORS: {
  [t in TargetType]: (...args: any[]) => AnnotationTarget<t>;
} = {
  [TargetType.CLASS]: _createClassAnnotationTarget,
  [TargetType.PROPERTY]: _createPropertyAnnotationTarget,
  [TargetType.METHOD]: _createMethodAnnotationTarget,
  [TargetType.PARAMETER]: _createParameterAnnotationTarget,
};

function _createClassAnnotationTarget<X = unknown>(
  targetFactory: AnnotationTargetFactory,
  targetArgs: DecoratorTargetArgs<TargetType.CLASS, X>,
  targetRef: AnnotationTargetRef,
): ClassAnnotationTarget<X> {
  return new ClassAnnotationTargetImpl(targetFactory, targetArgs, {
    ref: targetRef,
    name: targetArgs.proto.constructor.name,
    label: `class ${targetArgs.proto.constructor.name}`,
  });
}

function _createMethodAnnotationTarget<X = unknown>(
  targetFactory: AnnotationTargetFactory,
  targetArgs: DecoratorTargetArgs<TargetType.METHOD, X>,
  targetRef: AnnotationTargetRef,
): MethodAnnotationTarget<X> {
  assert(!!targetArgs.propertyKey);

  return new MethodAnnotationTargetImpl<X>(targetFactory, targetArgs, {
    name: targetArgs.propertyKey!,
    label: `method ${targetArgs.proto.constructor.name}.${String(
      targetArgs.propertyKey,
    )}`,
    ref: targetRef,
  });
}

function _createPropertyAnnotationTarget<X = unknown>(
  targetFactory: AnnotationTargetFactory,
  targetArgs: DecoratorTargetArgs<TargetType.PROPERTY, X>,
  targetRef: AnnotationTargetRef,
): PropertyAnnotationTarget<X> {
  const descriptor = Object.getOwnPropertyDescriptor(
    targetArgs.proto,
    targetArgs.propertyKey!,
  )!;

  // assert(!!descriptor);
  assert(targetArgs.type === TargetType.PROPERTY);

  return new PropertyAnnotationTargetImpl(targetFactory, targetArgs, {
    name: targetArgs.propertyKey!,
    label: `property ${targetArgs.proto.constructor.name}.${String(
      targetArgs.propertyKey,
    )}`,
    descriptor,
    ref: targetRef,
  });
}

function _createParameterAnnotationTarget<X = unknown>(
  targetFactory: AnnotationTargetFactory,
  targetArgs: DecoratorTargetArgs<TargetType.PARAMETER, X>,
  targetRef: AnnotationTargetRef,
): ParameterAnnotationTarget<X> {
  const descriptor = Object.getOwnPropertyDescriptor(
    targetArgs.proto,
    targetArgs.propertyKey!,
  )! as MethodPropertyDescriptor;

  const name = argsNames(targetArgs.proto[targetArgs.propertyKey!])[
    targetArgs.parameterIndex!
  ]!;
  assert(!!descriptor);
  assert(!!name);

  return new ParameterAnnotationTargetImpl<X>(targetFactory, targetArgs, {
    name,
    label: `parameter ${targetArgs.proto.constructor.name}.${String(
      targetArgs.propertyKey,
    )}(#${targetArgs.parameterIndex})`,

    descriptor,
    ref: targetRef,
  });
}

function _validateAnnotationTarget<
  T extends TargetType,
  R extends keyof DecoratorTargetArgs,
>(targetArgs: DecoratorTargetArgs<T>, requiredProperties: R[]): void {
  requiredProperties.forEach((n) =>
    assert(!isUndefined(targetArgs[n]), `target.${n} is undefined`),
  );
}

function _parentClassTarget<X>(
  targetFactory: AnnotationTargetFactory,
  targetArgs: DecoratorTargetArgs,
): ClassAnnotationTarget<X> | undefined {
  const parentProto = Object.getPrototypeOf(targetArgs.proto);

  return !parentProto || parentProto === Object.prototype // no parent
    ? undefined
    : (targetFactory.of(parentProto) as ClassAnnotationTarget<X>);
}

function _declaringClassTarget<X>(
  targetFactory: AnnotationTargetFactory,
  targetArgs: DecoratorTargetArgs,
): ClassAnnotationTarget<X> {
  return targetFactory.get({
    ...targetArgs,
    type: TargetType.CLASS,
  }) as ClassAnnotationTarget<X>;
}

function _declaringMethodTarget<X>(
  targetFactory: AnnotationTargetFactory,
  targetArgs: DecoratorTargetArgs<TargetType.PARAMETER>,
): MethodAnnotationTarget<X> {
  return targetFactory.get({
    proto: targetArgs.proto,
    propertyKey: targetArgs.propertyKey,
    type: TargetType.METHOD,
  }) as MethodAnnotationTarget<X>;
}

abstract class AnnotationTargetImpl {
  toString() {
    return (this as any as AnnotationTarget).label;
  }
}

class ClassAnnotationTargetImpl<X>
  extends AnnotationTargetImpl
  implements ClassAnnotationTarget<X>
{
  public readonly type = TargetType.CLASS;
  public readonly proto: Prototype<X>;
  public readonly name: string;
  public readonly label: string;
  public readonly ref: AnnotationTargetRef;
  public readonly declaringClass = this;
  private _parentClass?: ClassAnnotationTarget<X>;
  constructor(
    private targetFactory: AnnotationTargetFactory,
    targetArgs: DecoratorTargetArgs<TargetType.CLASS, X>,
    target: Partial<ClassAnnotationTargetImpl<X>>,
  ) {
    super();

    this.proto = targetArgs.proto!;
    this.name = target.name!;
    this.label = target.label!;
    this.ref = target.ref!;

    _validateAnnotationTarget(targetArgs, ['proto']);
  }

  get parentClass(): ClassAnnotationTarget<X> | undefined {
    return (
      this._parentClass ??
      (this._parentClass = _parentClassTarget(this.targetFactory, this))
    );
  }

  get parent(): ClassAnnotationTarget<any> | undefined {
    return this.parentClass;
  }
}

class MethodAnnotationTargetImpl<X>
  extends AnnotationTargetImpl
  implements MethodAnnotationTarget<X>
{
  readonly type = TargetType.METHOD;
  readonly proto: Prototype<X>;
  readonly propertyKey!: string;
  readonly descriptor: MethodPropertyDescriptor;
  readonly name: string;
  readonly label: string;
  readonly ref: AnnotationTargetRef;
  private _declaringClassTarget?: ClassAnnotationTarget<X>;
  private _parentClassTarget?: ClassAnnotationTarget<X> | undefined;

  constructor(
    private targetFactory: AnnotationTargetFactory,
    targetArgs: DecoratorTargetArgs<TargetType.METHOD, X>,
    target: Partial<MethodAnnotationTargetImpl<X>>,
  ) {
    super();
    this.proto = targetArgs.proto;
    this.propertyKey = targetArgs.propertyKey as any;
    this.descriptor = targetArgs.descriptor! as MethodPropertyDescriptor;
    this.name = target.name!;
    this.label = target.label!;
    this.ref = target.ref!;
    _validateAnnotationTarget(targetArgs, [
      'proto',
      'propertyKey',
      'descriptor',
    ]);
  }

  get declaringClass() {
    return (
      this._declaringClassTarget ??
      (this._declaringClassTarget = _declaringClassTarget<X>(
        this.targetFactory,
        this,
      ))
    );
  }
  get parent() {
    return this.declaringClass;
  }
  get parentClass() {
    return (
      this._parentClassTarget ??
      (this._parentClassTarget = _parentClassTarget(this.targetFactory, this))
    );
  }
}

class PropertyAnnotationTargetImpl<X>
  extends AnnotationTargetImpl
  implements PropertyAnnotationTarget<X>
{
  readonly propertyKey!: string;
  readonly descriptor: TypedPropertyDescriptor<unknown>;
  readonly type = TargetType.PROPERTY;
  readonly proto: Prototype<X>;
  readonly name: string;
  readonly label: string;
  readonly ref: AnnotationTargetRef;
  private _declaringClassTarget?: ClassAnnotationTarget<X>;
  private _parentClassTarget?: ClassAnnotationTarget<X> | undefined;
  constructor(
    private targetFactory: AnnotationTargetFactory,
    targetArgs: DecoratorTargetArgs<TargetType.PROPERTY, X>,
    target: Partial<PropertyAnnotationTargetImpl<X>>,
  ) {
    super();
    this.propertyKey = targetArgs.propertyKey!;
    this.descriptor = targetArgs.descriptor!;
    this.proto = targetArgs.proto!;
    this.name = target.name!;
    this.label = target.label!;
    this.ref = target.ref!;

    _validateAnnotationTarget(targetArgs, ['proto', 'propertyKey']);
  }
  get declaringClass() {
    return (
      this._declaringClassTarget ??
      (this._declaringClassTarget = _declaringClassTarget(
        this.targetFactory,
        this,
      ))
    );
  }
  get parent() {
    return this.declaringClass;
  }
  get parentClass() {
    return (
      this._parentClassTarget ??
      (this._parentClassTarget = _parentClassTarget(this.targetFactory, this))
    );
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

class ParameterAnnotationTargetImpl<X>
  extends AnnotationTargetImpl
  implements ParameterAnnotationTarget<X>
{
  readonly propertyKey!: string;
  readonly parameterIndex!: number;
  readonly descriptor!: MethodPropertyDescriptor;
  readonly type = TargetType.PARAMETER;
  readonly proto!: Prototype<X>;
  readonly name!: string;
  readonly label!: string;
  readonly ref!: AnnotationTargetRef;
  private _parentClassTarget: ClassAnnotationTarget<X> | undefined;
  private _declaringClassTarget!: ClassAnnotationTarget<X>;
  private _declaringMethodTarget!: MethodAnnotationTarget<X>;

  constructor(
    private targetFactory: AnnotationTargetFactory,
    targetArgs: DecoratorTargetArgs<TargetType.PARAMETER, X>,
    target: Partial<MethodAnnotationTargetImpl<X>>,
  ) {
    super();
    this.propertyKey = targetArgs.propertyKey!;
    this.descriptor = targetArgs.descriptor! as MethodPropertyDescriptor;
    this.parameterIndex = targetArgs.parameterIndex!;
    this.proto = targetArgs.proto!;
    this.name = target.name!;
    this.label = target.label!;
    this.ref = target.ref!;

    _validateAnnotationTarget(targetArgs, [
      'parameterIndex',
      'proto',
      'propertyKey',
    ]);
  }

  get declaringClass(): ClassAnnotationTarget<X> {
    return (
      this._declaringClassTarget ??
      (this._declaringClassTarget = _declaringClassTarget<X>(
        this.targetFactory,
        this,
      ))
    );
  }

  get parent(): MethodAnnotationTarget<X> {
    return (
      this._declaringMethodTarget ??
      (this._declaringMethodTarget = _declaringMethodTarget<X>(
        this.targetFactory,
        this,
      ))
    );
  }

  get parentClass(): ClassAnnotationTarget<X> {
    return (
      this._parentClassTarget ??
      ((this._parentClassTarget = _parentClassTarget<X>(
        this.targetFactory,
        this,
      )) as any)
    );
  }
}
