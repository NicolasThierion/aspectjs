import {
  assert,
  getMetadata,
  isUndefined,
  MethodPropertyDescriptor,
  Prototype,
} from '@aspectjs/common/utils';
import { AnnotationType } from '../annotation.types';
import {
  AnnotationTarget,
  AnnotationTargetRef,
  ClassAnnotationTarget,
  MethodAnnotationTarget,
  ParameterAnnotationTarget,
  PropertyAnnotationTarget,
} from './annotation-target';
import { AnnotationTargetFactory } from './annotation-target.factory';
import {
  _AnnotationTargetImpl,
  BOUND_INSTANCE_SYMBOL,
} from './annotation-target.impl';
import { DecoratorTargetArgs } from './target-args';

let _globalTargetId = 0;

const _REF_GENERATORS = {
  [AnnotationType.CLASS]: (id: number, d: DecoratorTargetArgs) => {
    const ref = `c[${d.proto.constructor.name}]`;

    return getMetadata(
      `aspectjs.targetFactory#${id}:${ref}`,
      d.proto,
      () => new AnnotationTargetRef(`${ref}#${_globalTargetId++}`),
    );
  },
  [AnnotationType.PROPERTY]: (id: number, d: DecoratorTargetArgs) => {
    const ref = `c[${d.proto.constructor.name}].p[${d.propertyKey}]`;
    return getMetadata(
      `aspectjs.targetFactory#${id}:${ref}`,
      _REF_GENERATORS[AnnotationType.CLASS](id, d),
      () => new AnnotationTargetRef(`${ref}#${_globalTargetId++}`),
    );
  },
  [AnnotationType.METHOD]: (id: number, d: DecoratorTargetArgs) => {
    const ref = `c[${d.proto.constructor.name}].m[${d.propertyKey}]`;
    return getMetadata(
      `aspectjs.targetFactory#${id}:${ref}`,
      _REF_GENERATORS[AnnotationType.CLASS](id, d),
      () => new AnnotationTargetRef(`${ref}#${_globalTargetId++}`),
    );
  },
  [AnnotationType.PARAMETER]: (id: number, d: DecoratorTargetArgs) => {
    const ref = `c[${d.proto.constructor.name}].m[${d.propertyKey}].a[${d.parameterIndex}]`;
    return getMetadata(
      `aspectjs.targetFactory#${id}:${ref}`,
      _REF_GENERATORS[AnnotationType.CLASS](id, d),
      () => new AnnotationTargetRef(`${ref}#${_globalTargetId++}`),
    );
  },
};

const _TARGET_GENERATORS: {
  [t in AnnotationType]: (...args: any[]) => AnnotationTarget<t>;
} = {
  [AnnotationType.CLASS]: _createClassAnnotationTarget,
  [AnnotationType.PROPERTY]: _createPropertyAnnotationTarget,
  [AnnotationType.METHOD]: _createMethodAnnotationTarget,
  [AnnotationType.PARAMETER]: _createParameterAnnotationTarget,
};

/**
 * @internal
 * @param targetFactory
 * @param decoratorArgs
 * @returns
 */
export function _findOrCreateAnnotationTarget<
  T extends AnnotationType = AnnotationType,
  X = unknown,
>(
  targetFactory: AnnotationTargetFactory,
  decoratorArgs: DecoratorTargetArgs<T, X>,
): AnnotationTarget<T, X> {
  const ref = _REF_GENERATORS[decoratorArgs.type](
    targetFactory.id,
    decoratorArgs,
  );

  return getMetadata(
    ref.value,
    decoratorArgs.proto,
    () => {
      return _TARGET_GENERATORS[decoratorArgs.type](
        targetFactory,
        decoratorArgs,
        ref,
      );
    },
    true,
  ) as AnnotationTarget<T, X>;
}

/**
 * @internal
 * @param targetArgs
 * @param requiredProperties
 */
export function _validateAnnotationTarget<
  T extends AnnotationType,
  R extends keyof DecoratorTargetArgs,
>(targetArgs: DecoratorTargetArgs<T>, requiredProperties: R[]): void {
  requiredProperties.forEach((n) =>
    assert(!isUndefined(targetArgs[n]), `target.${n} is undefined`),
  );
}

/**
 * @internal
 * @param targetArgs
 * @param requiredProperties
 */
export function _parentClassTarget<X>(
  targetFactory: AnnotationTargetFactory,
  targetArgs: DecoratorTargetArgs,
  instance: X | undefined,
): ClassAnnotationTarget<X> | undefined {
  const parentProto = Object.getPrototypeOf(targetArgs.proto);

  if (!parentProto || parentProto === Object.prototype) {
    // no parent
    return undefined;
  }

  const target = targetFactory.of(parentProto);
  if (typeof instance !== 'undefined') {
    return (target as _AnnotationTargetImpl<AnnotationType.CLASS, X>).bind(
      instance,
    );
  }

  return target;
}

/**
 * @internal
 * @param targetArgs
 * @param requiredProperties
 */
export function _declaringClassTarget<X>(
  targetFactory: AnnotationTargetFactory,
  targetArgs: DecoratorTargetArgs<AnnotationType, X>,
  instance: X | undefined,
): ClassAnnotationTarget<X> {
  const target = _findOrCreateAnnotationTarget(targetFactory, {
    ...targetArgs,
    type: AnnotationType.CLASS,
  });

  if (typeof instance !== 'undefined') {
    return (target as _AnnotationTargetImpl<AnnotationType.CLASS, X>).bind(
      instance,
    );
  }

  return target;
}

/**
 * @internal
 * @param targetArgs
 * @param requiredProperties
 */
export function _declaringMethodTarget<X>(
  targetFactory: AnnotationTargetFactory,

  targetArgs: DecoratorTargetArgs<AnnotationType.PARAMETER, X>,
): MethodAnnotationTarget<X> {
  return _findOrCreateAnnotationTarget<AnnotationType.METHOD, X>(
    targetFactory,
    {
      proto: targetArgs.proto,
      propertyKey: targetArgs.propertyKey,
      type: AnnotationType.METHOD,
      descriptor: _findPropertyDescriptor(
        targetArgs.proto,
        targetArgs.propertyKey!,
      ),
    },
  );
}

/**
 * @internal
 */
export function _findPropertyDescriptor(
  obj: Prototype,
  propertyKey: string | symbol,
): PropertyDescriptor | undefined {
  if (!obj) {
    return;
  }
  const descriptor = Object.getOwnPropertyDescriptor(obj, propertyKey);
  if (descriptor) {
    return descriptor;
  }

  return _findPropertyDescriptor(Object.getPrototypeOf(obj), propertyKey);
}

/**
 * @internal
 * @param targetFactory
 * @param targetArgs
 * @param targetRef
 * @returns
 */
function _createClassAnnotationTarget<X = unknown>(
  targetFactory: AnnotationTargetFactory,
  targetArgs: DecoratorTargetArgs<AnnotationType.CLASS, X>,
  targetRef: AnnotationTargetRef,
) {
  _validateAnnotationTarget(targetArgs, ['proto']);

  return new (class ClassAnnotationTargetImpl
    extends _AnnotationTargetImpl<AnnotationType.CLASS, X>
    implements ClassAnnotationTarget<X>
  {
    override [BOUND_INSTANCE_SYMBOL]?: X;
    private _parentClass?: ClassAnnotationTarget<X>;

    constructor() {
      super(
        AnnotationType.CLASS,
        targetArgs.proto,
        targetArgs.proto.constructor.name,
        `class ${targetArgs.proto.constructor.name}`,
        targetRef,
      );
    }

    public get declaringClass() {
      return this;
    }
    override get parentClass(): ClassAnnotationTarget<X> | undefined {
      const parentClass =
        this._parentClass ??
        (this._parentClass = _parentClassTarget(
          targetFactory,
          targetArgs,
          this[BOUND_INSTANCE_SYMBOL],
        ));

      if (parentClass && typeof this[BOUND_INSTANCE_SYMBOL] !== 'undefined') {
        return (parentClass as ClassAnnotationTargetImpl).bind(
          this[BOUND_INSTANCE_SYMBOL],
        );
      }
      return parentClass;
    }

    get parent(): ClassAnnotationTarget<any> | undefined {
      return this.parentClass;
    }

    override bind(value: X): ClassAnnotationTarget<X> {
      const bound = new ClassAnnotationTargetImpl();
      if (!bound[BOUND_INSTANCE_SYMBOL]) {
        Object.defineProperty(bound, 'value', {
          get: () => value,
        });
        bound[BOUND_INSTANCE_SYMBOL] = value;
      }

      return bound;
    }
  })();
}

function _createMethodAnnotationTarget<X = unknown>(
  targetFactory: AnnotationTargetFactory,
  targetArgs: DecoratorTargetArgs<AnnotationType.METHOD, X>,
  targetRef: AnnotationTargetRef,
): MethodAnnotationTarget<X> {
  assert(!!targetArgs.propertyKey);

  _validateAnnotationTarget(targetArgs, ['proto', 'propertyKey', 'descriptor']);

  return new (class MethodAnnotationTargetImpl
    extends _AnnotationTargetImpl<AnnotationType.METHOD, X>
    implements MethodAnnotationTarget<X>
  {
    readonly propertyKey: string;
    readonly descriptor: MethodPropertyDescriptor;
    override [BOUND_INSTANCE_SYMBOL]?: X;

    private _declaringClassTarget?: ClassAnnotationTarget<X>;
    private _parentClassTarget?: ClassAnnotationTarget<X> | undefined;

    constructor() {
      super(
        AnnotationType.METHOD,
        targetArgs.proto,
        targetArgs.propertyKey!,
        `method ${targetArgs.proto.constructor.name}.${String(
          targetArgs.propertyKey,
        )}`,
        targetRef,
      );

      this.propertyKey = targetArgs.propertyKey!;
      this.descriptor = targetArgs.descriptor! as MethodPropertyDescriptor;
    }

    get declaringClass() {
      return (
        this._declaringClassTarget ??
        (this._declaringClassTarget = _declaringClassTarget<X>(
          targetFactory,
          targetArgs,
          this[BOUND_INSTANCE_SYMBOL],
        ))
      );
    }
    get parent() {
      return this.declaringClass;
    }
    override get parentClass() {
      return (
        this._parentClassTarget ??
        (this._parentClassTarget = _parentClassTarget(
          targetFactory,
          targetArgs,
          this[BOUND_INSTANCE_SYMBOL],
        ))
      );
    }

    override bind(value: X): MethodAnnotationTarget<X> {
      const bound = new MethodAnnotationTargetImpl();

      if (!bound[BOUND_INSTANCE_SYMBOL]) {
        bound[BOUND_INSTANCE_SYMBOL] = value;
        Object.defineProperty(bound, 'value', {
          get: () => bound.proto[bound.propertyKey],
        });
      }
      return bound;
    }
  })();
}

/**
 * @internal
 * @param targetFactory
 * @param targetArgs
 * @param targetRef
 * @returns
 */
function _createParameterAnnotationTarget<X = unknown>(
  targetFactory: AnnotationTargetFactory,
  targetArgs: DecoratorTargetArgs<AnnotationType.PARAMETER, X>,
  targetRef: AnnotationTargetRef,
): ParameterAnnotationTarget<X> {
  const descriptor = Object.getOwnPropertyDescriptor(
    targetArgs.proto,
    targetArgs.propertyKey!,
  )! as MethodPropertyDescriptor;

  const name =
    argsNames(targetArgs.proto[targetArgs.propertyKey!])[
      targetArgs.parameterIndex!
    ] ?? `#${targetArgs.parameterIndex!}`;
  assert(!!descriptor);

  return new (class ParameterAnnotationTargetImpl
    extends _AnnotationTargetImpl<AnnotationType.PARAMETER, X>
    implements ParameterAnnotationTarget<X>
  {
    readonly propertyKey!: string;
    readonly parameterIndex!: number;
    readonly descriptor!: MethodPropertyDescriptor;
    override [BOUND_INSTANCE_SYMBOL]?: X;

    private _parentClassTarget: ClassAnnotationTarget<X> | undefined;
    private _declaringClassTarget!: ClassAnnotationTarget<X>;
    private _declaringMethodTarget!: MethodAnnotationTarget<X>;

    constructor() {
      super(
        AnnotationType.PARAMETER,
        targetArgs.proto,
        name,
        `parameter ${name} of method ${
          targetArgs.proto.constructor.name
        }.${String(targetArgs.propertyKey)}`,
        targetRef,
      );

      this.propertyKey = targetArgs.propertyKey!;
      this.descriptor = targetArgs.descriptor! as MethodPropertyDescriptor;
      this.parameterIndex = targetArgs.parameterIndex!;

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
          targetFactory,
          targetArgs,
          this[BOUND_INSTANCE_SYMBOL],
        ))
      );
    }

    get parent(): MethodAnnotationTarget<X> {
      return (
        this._declaringMethodTarget ??
        (this._declaringMethodTarget = _declaringMethodTarget<X>(
          targetFactory,
          targetArgs,
        ))
      );
    }

    get parentClass() {
      return (
        this._parentClassTarget ??
        (this._parentClassTarget = _parentClassTarget<X>(
          targetFactory,
          targetArgs,
          this[BOUND_INSTANCE_SYMBOL],
        ))
      );
    }

    override bind(instance: X, args: unknown[]): ParameterAnnotationTarget<X> {
      const bound = new ParameterAnnotationTargetImpl();

      if (!bound[BOUND_INSTANCE_SYMBOL]) {
        bound[BOUND_INSTANCE_SYMBOL] = instance;
        assert(!!args);

        if (args) {
          Object.defineProperty(bound, 'value', {
            get: () => args[bound.parameterIndex],
          });
        }
      }

      return bound;
    }
  })();
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

/**
 * @internal
 * @param targetFactory
 * @param targetArgs
 * @param targetRef
 * @returns
 */
function _createPropertyAnnotationTarget<X = unknown>(
  targetFactory: AnnotationTargetFactory,
  targetArgs: DecoratorTargetArgs<AnnotationType.PROPERTY, X>,
  targetRef: AnnotationTargetRef,
): PropertyAnnotationTarget {
  // assert(!!descriptor);
  assert(targetArgs.type === AnnotationType.PROPERTY);

  return new (class PropertyAnnotationTargetImpl
    extends _AnnotationTargetImpl<AnnotationType.PROPERTY, X>
    implements PropertyAnnotationTarget<X>
  {
    readonly propertyKey!: string;
    readonly descriptor: TypedPropertyDescriptor<unknown>;
    override [BOUND_INSTANCE_SYMBOL]?: X;

    private _declaringClassTarget?: ClassAnnotationTarget<X>;
    private _parentClassTarget?: ClassAnnotationTarget<X> | undefined;
    constructor() {
      super(
        AnnotationType.PROPERTY,
        targetArgs.proto,
        targetArgs.propertyKey!,
        `property ${targetArgs.proto.constructor.name}.${String(
          targetArgs.propertyKey,
        )}`,
        targetRef,
      );
      this.propertyKey = targetArgs.propertyKey!;
      this.descriptor = Object.getOwnPropertyDescriptor(
        targetArgs.proto,
        targetArgs.propertyKey!,
      )!;

      _validateAnnotationTarget(targetArgs, ['proto', 'propertyKey']);
    }
    get declaringClass() {
      return (
        this._declaringClassTarget ??
        (this._declaringClassTarget = _declaringClassTarget(
          targetFactory,
          targetArgs,
          this[BOUND_INSTANCE_SYMBOL],
        ))
      );
    }
    get parent() {
      return this.declaringClass;
    }
    get parentClass() {
      return (
        this._parentClassTarget ??
        (this._parentClassTarget = _parentClassTarget(
          targetFactory,
          targetArgs,
          this[BOUND_INSTANCE_SYMBOL],
        ))
      );
    }

    override bind(instance: X): PropertyAnnotationTarget<X> {
      const bound = new PropertyAnnotationTargetImpl();

      if (!bound[BOUND_INSTANCE_SYMBOL]) {
        bound[BOUND_INSTANCE_SYMBOL] = instance;
        Object.defineProperty(bound, 'value', {
          get: () => (instance as any)[bound.propertyKey],
        });
      }
      return bound;
    }
  })();
}
