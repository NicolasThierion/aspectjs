import { assert, getMetadata, isUndefined } from '@aspectjs/common/utils';
import type { ConstructorType } from '../../constructor.type';
import { DecoratorType } from '../annotation.types';
import {
  AnnotationTarget,
  AnnotationTargetRef,
  ClassAnnotationTarget,
  MethodAnnotationTarget,
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
    [DecoratorType.CLASS]: (d: DecoratorTargetArgs) => {
      const ref = `c[${d.proto.constructor.name}]`;

      return getMetadata(
        `aspectjs.targetFactory#${this.id}:${ref}`,
        d.proto,
        () => new AnnotationTargetRef(`${ref}#${_globalTargetId++}`),
      );
    },
    [DecoratorType.PROPERTY]: (d: DecoratorTargetArgs) => {
      const ref = `c[${d.proto.constructor.name}].p[${d.propertyKey}]`;
      return getMetadata(
        `aspectjs.targetFactory#${this.id}:${ref}`,
        this._REF_GENERATORS[DecoratorType.CLASS](d),
        () => new AnnotationTargetRef(`${ref}#${_globalTargetId++}`),
      );
    },
    [DecoratorType.METHOD]: (d: DecoratorTargetArgs) => {
      const ref = `c[${d.proto.constructor.name}].m[${d.propertyKey}]`;
      return getMetadata(
        `aspectjs.targetFactory#${this.id}:${ref}`,
        this._REF_GENERATORS[DecoratorType.CLASS](d),
        () => new AnnotationTargetRef(`${ref}#${_globalTargetId++}`),
      );
    },
    [DecoratorType.PARAMETER]: (d: DecoratorTargetArgs) => {
      const ref = `c[${d.proto.constructor.name}].m[${d.propertyKey}].a[${d.parameterIndex}]`;
      return getMetadata(
        `aspectjs.targetFactory#${this.id}:${ref}`,
        this._REF_GENERATORS[DecoratorType.CLASS](d),
        () => new AnnotationTargetRef(`${ref}#${_globalTargetId++}`),
      );
    },
  };
  /**
   * Creates an AnnotationTarget from the given argument
   * @param decoratorArgs - the AnnotationTarget stub.
   * @param type - target type override
   */
  register<T extends DecoratorType = DecoratorType, X = unknown>(
    decoratorArgs: DecoratorTargetArgs<T>,
  ): AnnotationTarget<T, X> {
    return this._findOrCreate(
      this._REF_GENERATORS[decoratorArgs.type](decoratorArgs),
      decoratorArgs,
      true,
    );
  }

  find<T extends DecoratorType = DecoratorType, X = unknown>(
    decoratorArgs: DecoratorTargetArgs<T>,
  ): AnnotationTarget<T, X> {
    const type = decoratorArgs.type;
    const ref = this._REF_GENERATORS[type](decoratorArgs);

    return this._findOrCreate(ref, decoratorArgs, false);
  }
  private _findOrCreate<T extends DecoratorType = DecoratorType, X = unknown>(
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

  get<T extends DecoratorType = DecoratorType, X = unknown>(
    decoratorArgs: DecoratorTargetArgs<T>,
  ): AnnotationTarget<T, X>;
  get<T extends DecoratorType = DecoratorType, X = unknown>(
    decoratorArgs: DecoratorTargetArgs<T>,
  ): AnnotationTarget<T, X> {
    const target = this.find<T, X>(decoratorArgs);

    if (!target) {
      const type = decoratorArgs.type;
      const ref = this._REF_GENERATORS[type](decoratorArgs);

      throw new Error(`no AnnotationTarget found with ref ${ref}`);
    }

    return target;
  }

  of<T extends DecoratorType = DecoratorType, X = unknown>(
    target: ConstructorType<X>,
  ): AnnotationTarget<T, X>;

  of<T extends DecoratorType = DecoratorType, X = unknown>(
    target: X,
    propertyKey: string | symbol,
  ): AnnotationTarget<T, X>;

  of<T extends DecoratorType = DecoratorType, X = unknown>(
    target: X,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): AnnotationTarget<T, X>;

  of<T extends DecoratorType = DecoratorType, X = unknown>(
    target: X,
    propertyKey: string | symbol,
    parameterIndex: number,
  ): AnnotationTarget<T, X>;

  of<T extends DecoratorType = DecoratorType, X = unknown>(
    ...args: unknown[]
  ): AnnotationTarget<T, X> {
    // ClassAnnotation = <TFunction extends Function>(target: TFunction) => TFunction | void;
    // PropertyAnnotation = (target: Object, propertyKey: string | symbol) => void;
    // MethodAnnotation = <A>(target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<A>) => TypedPropertyDescriptor<A> | void;
    // ParameterAnnotation = (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;

    return this.find(DecoratorTargetArgs.of(args));
  }
}

const _TARGET_GENERATORS: {
  [t in DecoratorType]: (...args: any[]) => AnnotationTarget<t>;
} = {
  [DecoratorType.CLASS]: _createClassAnnotationTarget,
  [DecoratorType.PROPERTY]: _createPropertyAnnotationTarget,
  [DecoratorType.METHOD]: _createMethodAnnotationTarget,
  [DecoratorType.PARAMETER]: _createParameterAnnotationTarget,
};

function _createClassAnnotationTarget<X = unknown>(
  targetFactory: AnnotationTargetFactory,
  targetArgs: DecoratorTargetArgs<DecoratorType.CLASS>,
  targetRef: AnnotationTargetRef,
): ClassAnnotationTarget<X> {
  return new ClassAnnotationTargetImpl(targetFactory, targetArgs, {
    ref: targetRef,
    name: targetArgs.proto.constructor.name,
    label: `class "${targetArgs.proto.constructor.name}"`,
  });
}

function _createMethodAnnotationTarget<X = unknown>(
  targetFactory: AnnotationTargetFactory,
  targetArgs: DecoratorTargetArgs<DecoratorType.METHOD>,
  targetRef: AnnotationTargetRef,
): MethodAnnotationTarget<X> {
  assert(!!targetArgs.propertyKey);

  return new MethodAnnotationTargetImpl<X>(targetFactory, targetArgs, {
    name: targetArgs.propertyKey!,
    label: `method "${targetArgs.proto.constructor.name}.${String(
      targetArgs.propertyKey,
    )}"`,
    ref: targetRef,
  });
}

function _createPropertyAnnotationTarget<X = unknown>(
  targetFactory: AnnotationTargetFactory,
  targetArgs: DecoratorTargetArgs<DecoratorType.PROPERTY>,
  targetRef: AnnotationTargetRef,
): PropertyAnnotationTarget<X> {
  const descriptor = Object.getOwnPropertyDescriptor(
    targetArgs.proto,
    targetArgs.propertyKey!,
  )!;

  // assert(!!descriptor);
  assert(targetArgs.type === DecoratorType.PROPERTY);

  return new PropertyAnnotationTargetImpl(targetFactory, targetArgs, {
    name: targetArgs.propertyKey!,
    label: `property "${targetArgs.proto.constructor.name}.${String(
      targetArgs.propertyKey,
    )}"`,
    descriptor,
    ref: targetRef,
  });
}

function _createParameterAnnotationTarget<X = unknown>(
  targetFactory: AnnotationTargetFactory,
  targetArgs: DecoratorTargetArgs<DecoratorType.PARAMETER>,
  targetRef: AnnotationTargetRef,
): ParameterAnnotationTarget<X> {
  const descriptor = Object.getOwnPropertyDescriptor(
    targetArgs.proto,
    targetArgs.propertyKey!,
  )!;

  const name = argsNames(targetArgs.proto[targetArgs.propertyKey!])[
    targetArgs.parameterIndex!
  ]!;
  assert(!!descriptor);
  assert(!!name);

  return new ParameterAnnotationTargetImpl<X>(targetFactory, targetArgs, {
    name,
    label: `parameter "${targetArgs.proto.constructor.name}.${String(
      targetArgs.propertyKey,
    )}(#${targetArgs.parameterIndex})"`,

    descriptor,
    ref: targetRef,
  });
}

function _validateAnnotationTarget<
  T extends DecoratorType,
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

  return parentProto === Object.prototype
    ? undefined
    : (targetFactory.register(
        DecoratorTargetArgs.of([parentProto]),
      ) as ClassAnnotationTarget);
}

function _declaringClassTarget<X>(
  targetFactory: AnnotationTargetFactory,
  targetArgs: DecoratorTargetArgs,
): ClassAnnotationTarget<X> {
  return targetFactory.register({ ...targetArgs, type: DecoratorType.CLASS });
}

function _declaringMethodTarget<X>(
  targetFactory: AnnotationTargetFactory,
  targetArgs: DecoratorTargetArgs<DecoratorType.PARAMETER>,
): MethodAnnotationTarget<X> {
  return targetFactory.register({
    proto: targetArgs.proto,
    propertyKey: targetArgs.propertyKey,
    type: DecoratorType.METHOD,
  });
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
  public readonly type = DecoratorType.CLASS;
  public readonly proto: Prototype;
  public readonly name: string;
  public readonly label: string;
  public readonly ref: AnnotationTargetRef;
  public readonly declaringClass = this;
  private _parentClass?: ClassAnnotationTarget<X>;
  constructor(
    private targetFactory: AnnotationTargetFactory,
    targetArgs: DecoratorTargetArgs<DecoratorType.CLASS>,
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
  readonly type = DecoratorType.METHOD;
  readonly proto: Prototype;
  readonly propertyKey!: string;
  readonly descriptor: TypedPropertyDescriptor<unknown>;
  readonly name: string;
  readonly label: string;
  readonly ref: AnnotationTargetRef;
  private _declaringClassTarget?: ClassAnnotationTarget<unknown>;
  private _parentClassTarget?: ClassAnnotationTarget<unknown> | undefined;

  constructor(
    private targetFactory: AnnotationTargetFactory,
    targetArgs: DecoratorTargetArgs<DecoratorType.METHOD>,
    target: Partial<MethodAnnotationTargetImpl<X>>,
  ) {
    super();
    this.proto = targetArgs.proto;
    this.propertyKey = targetArgs.propertyKey as any;
    this.descriptor = targetArgs.descriptor!;
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

class PropertyAnnotationTargetImpl<X>
  extends AnnotationTargetImpl
  implements PropertyAnnotationTarget<X>
{
  readonly propertyKey!: string;
  readonly descriptor: TypedPropertyDescriptor<unknown>;
  readonly type = DecoratorType.PROPERTY;
  readonly proto: Prototype;
  readonly name: string;
  readonly label: string;
  readonly ref: AnnotationTargetRef;
  private _declaringClassTarget?: ClassAnnotationTarget<unknown>;
  private _parentClassTarget?: ClassAnnotationTarget<unknown> | undefined;
  constructor(
    private targetFactory: AnnotationTargetFactory,
    targetArgs: DecoratorTargetArgs<DecoratorType.PROPERTY>,
    target: Partial<MethodAnnotationTargetImpl<X>>,
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
  readonly descriptor!: TypedPropertyDescriptor<unknown>;
  readonly type = DecoratorType.PARAMETER;
  readonly proto!: Prototype;
  readonly name!: string;
  readonly label!: string;
  readonly ref!: AnnotationTargetRef;
  private _parentClassTarget: ClassAnnotationTarget<X> | undefined;
  private _declaringClassTarget!: ClassAnnotationTarget<X>;
  private _declaringMethodTarget!: MethodAnnotationTarget<unknown>;

  constructor(
    private targetFactory: AnnotationTargetFactory,
    targetArgs: DecoratorTargetArgs<DecoratorType.PARAMETER>,
    target: Partial<MethodAnnotationTargetImpl<X>>,
  ) {
    super();
    this.propertyKey = targetArgs.propertyKey!;
    this.descriptor = targetArgs.descriptor!;
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

  get parentClass(): ClassAnnotationTarget<unknown> {
    return (
      this._parentClassTarget ??
      ((this._parentClassTarget = _parentClassTarget<unknown>(
        this.targetFactory,
        this,
      )) as any)
    );
  }
}
