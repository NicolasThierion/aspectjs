import { AnnotationRef } from '../annotation-ref';
import {
  Annotation,
  AnnotationKind,
  AnyDecorator,
  Decorator,
} from '../annotation.types';
import { DecoratorHookRegistry } from './decorator-hook.registry';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-function */

import {
  _copyPropsAndMeta,
  assert,
  getPrototype,
} from '@aspectjs/common/utils';
import { ReflectContext } from '../../reflect/reflect.context';
import { reflectContext } from '../../reflect/reflect.context.global';
import { ReflectError } from '../../reflect/reflect.error';
import { AnnotationContext } from '../annotation-context';
import type { AnnotationStub } from '../annotation.types';
import { AnnotationRegistry } from '../registry/annotation.registry';
import { AnnotationTargetFactory } from '../target/annotation-target.factory';
let anonymousAnnotationId = 0;

/**
 * Options given to decoree.annotations {@link AnnotationFactory} to create a new annotation.
 * @typeParam T the type of annotation to create
 * @typeParam S the signature of the annotation to create. It defines the name of the annotation and the set of accepted parameters.
 */
export interface AnnotationCreateOptions<
  T extends AnnotationKind,
  S extends AnnotationStub<T>,
> {
  /**
   * The name of the annotation to create.
   */
  name?: string;
  /**
   * An no-op function with the same signature as the annotation to create.
   */
  annotationStub?: S;
  /**
   * The type of annotation to create.
   */
  type?: T;
}
/**
 * Factory to create an {@link Annotation}.
 */
export class AnnotationFactory {
  /**
   * Create a new AnnotationFactory with the given `groupId`.
   * You generaly have to choose a `groupId` that identifies your project or is unique to your organisation.
   * The `groupId` will be used as a part of the signature for the created annotations.
   * @param groupId The groupId of this factory.
   */
  constructor(
    /**
     * The group of this factory.
     * All annotations created by this factory will belong to this group.
     */
    public readonly groupId: string,
  ) {}

  /**
   * Create an annotation with the given `type` and `name`.
   * @param type The type of annotation to create.
   * @param name The name of the annotation to create.
   * @typeParam T the type of annotation to create
   * @typeParam S the signature of the annotation to create. It defines the name of the annotation and the set of accepted parameters.
   * @example
   * ```ts
   * const LogErrors = new AnnotationFactory('demo').create();
   * // Or:
   * const LogErrors = new AnnotationFactory('demo').create(AnnotationKind.METHOD, 'LogErrors');
   * ```
   */
  create<T extends AnnotationKind, S extends AnnotationStub<T>>(
    type?: T,
    name?: string,
  ): Annotation<T, S>;

  /**
   * Create a new annotation with the given `name` and `type`.
   * If no annotation type is given, the annotation could be used above classes, methods, properties, attributes and parameters.
   *
   * @param name The name of the annotation to create.
   * @typeParam S the signature of the annotation to create. It defines the name of the annotation and the set of accepted parameters.
   * @example
   * ```ts
   * const LogErrors = new AnnotationFactory('demo').create('LogErrors');
   * ```
   */
  create<S extends AnnotationStub>(name?: string): Annotation<any, S>;

  /**
   * Create a new annotation wwith the given type and signature. The created annotation accepts the same parameters as with the the provid function.
   * If no annotation type is given, the annotation could be used above classes, methods, properties, attributes and parameters.
   *
   * @param type The type of annotation to create.
   * @param annotationStub The signature of the annotation to create.
   * @typeParam T the type of annotation to create
   * @typeParam S the signature of the annotation to create. It defines the name of the annotation and the set of accepted parameters.
   * @example
   * ```ts
   * const LogErrors = new AnnotationFactory('demo').create(
   *    AnnotationKind.METHOD,
   *    function Log(
   *      level: 'info' | 'warn' | 'error' | 'debug' = 'error',
   * ) {});
   * ```
   */
  create<T extends AnnotationKind, S extends AnnotationStub<T>>(
    type?: T,
    annotationStub?: S,
  ): Annotation<T, S>;

  /**
   * Create a new annotation with the given signature.
   * The created annotation has the same name as the given function, and accepts the same parameters.
   * If no annotation type is given, the annotation could be used above classes, methods, properties, attributes and parameters.
   *
   * @param annotationStub The signature of the annotation to create.
   * @typeParam S the signature of the annotation to create. It defines the name of the annotation and the set of accepted parameters.
   * @example
   * ```ts
   * const LogErrors = new AnnotationFactory('demo').create(
   *    AnnotationKind.METHOD,
   *    function Log(
   *      level: 'info' | 'warn' | 'error' | 'debug' = 'error',
   * ) {});
   * ```
   */
  create<S extends AnnotationStub>(annotationStub?: S): Annotation<any, S>;

  /**
   * Create with the a n annotation.
   * @param options The options for the annotation to create.
   * @typeParam T the type of annotation to create
   * @typeParam S the signature of the annotation to create. It defines the name of the annotation and the set of accepted parameters.
   */
  create<T extends AnnotationKind, S extends AnnotationStub<T>>(
    options?: AnnotationCreateOptions<T, S>,
  ): Annotation<T, S>;
  create<T extends AnnotationKind, S extends AnnotationStub<T>>(
    init?: string | S | AnnotationCreateOptions<T, S> | AnnotationKind,
    annotationStub?: S | string,
  ): Annotation<T, S> {
    const _opts = typeof init === 'object' ? init : {};

    if (typeof annotationStub === 'function') {
      _opts.annotationStub = annotationStub;
    } else if (typeof annotationStub === 'string') {
      _opts.name = annotationStub;
    }

    if (typeof _opts.annotationStub === 'function') {
      _opts.name = _opts.annotationStub.name;
    }

    if (typeof init === 'string') {
      _opts.name = init;
    } else if (typeof init === 'function') {
      _opts.name = init.name;
      _opts.annotationStub = init;
    } else if (typeof init === typeof AnnotationKind) {
      _opts.type = init as T;
    }

    const groupId = this.groupId;
    if (!_opts.name) {
      _opts.name = `anonymousAnnotation#${anonymousAnnotationId++}`;
    }

    if (!_opts.annotationStub) {
      _opts.annotationStub = function () {} as S;
    }

    // create the annotation (ie: decorator factory)
    return this._createAnnotation(groupId, _opts.name, _opts.annotationStub);
  }

  // Turn an annotation into an ES decorator
  private _createDecorator<
    T extends AnnotationKind,
    S extends AnnotationStub<T>,
  >(
    annotation: Annotation<T, S>,
    annotationStub: S,
    annotationArgs: any[],
  ): Decorator {
    const _this = this;
    return function (
      this: any,
      ...targetArgs: any[]
    ): Function | PropertyDescriptor | void {
      const reflect = reflectContext();

      const annotationContext = _this._createAnnotationContext<T, S>(
        reflect,
        annotation as any,
        annotationArgs,
        targetArgs,
      );

      return [...reflect.get(DecoratorHookRegistry).values()]
        .sort(
          (c1, c2) =>
            (c1.order ?? Number.MAX_SAFE_INTEGER) -
            (c2.order ?? Number.MAX_SAFE_INTEGER - 1),
        )

        .reduce(
          (decoree, { name, createDecorator: decorator }) => {
            try {
              const newDecoree = (decorator as any)
                .apply(this, [reflect, annotationContext, annotationStub])
                ?.apply(this, targetArgs);

              if (newDecoree) {
                if (decoree) {
                  const type = annotationContext.target.kind;
                  if (type === AnnotationKind.CLASS) {
                    const proto = getPrototype(
                      annotationContext.target.proto.constructor,
                    );
                    proto.constructor = newDecoree;
                    newDecoree.prototype = proto;
                    targetArgs[0] = newDecoree;

                    assert(
                      typeof newDecoree === 'function' &&
                        typeof decoree === 'function',
                    );
                    _copyPropsAndMeta(newDecoree, decoree); // copy static props
                  } else if (newDecoree.value) {
                    _copyPropsAndMeta(newDecoree.value, (decoree as any).value); // copy static props
                  }
                }

                decoree = newDecoree;
              }
              return decoree;
            } catch (e) {
              if (!(e instanceof ReflectError)) {
                console.error(
                  `Error applying annotation hook ${name}: ${
                    (e as Error).message
                  }`,
                );
              }

              throw e;
            }
          },
          noopDecorator.apply(this, targetArgs as any) as any,
        ) as any;
    };
  }

  private _createAnnotationContext<
    T extends AnnotationKind,
    S extends AnnotationStub<T>,
  >(
    reflect: ReflectContext,
    annotation: Annotation<T, S>,
    annotationArgs: unknown[],
    targetArgs: any[],
  ) {
    const targetFactory = reflect.get(AnnotationTargetFactory);
    const target = targetFactory.of.apply(targetFactory, targetArgs as any);
    assert(!!target);
    return new AnnotationContext(annotation, annotationArgs, target);
  }

  private _createAnnotation<
    T extends AnnotationKind,
    S extends AnnotationStub<T>,
  >(groupId: string, name: string, stub: S): Annotation<T, S> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _factory = this;
    const annotationRef = AnnotationRef.of(groupId, name);

    reflectContext().get(AnnotationRegistry).register(annotationRef);

    const annotation = function (...annotationArgs: any[]): Decorator {
      return _factory._createDecorator(annotation, stub, annotationArgs);
    } as any as Annotation<T, S>;

    // copy static properties
    Object.defineProperties(annotation, Object.getOwnPropertyDescriptors(stub));
    Object.defineProperties(
      annotation,
      Object.getOwnPropertyDescriptors(annotationRef),
    );
    Object.defineProperty(annotation, 'ref', {
      value: annotationRef,
    });

    annotation.toString = () => `@${annotation.name}`;

    return annotation;
  }
}

const noopDecorator: AnyDecorator = (<TFunction extends Function>(
  target: TFunction,
  propertyKey: string | symbol,
  _parameterIndex: number,
): any => {
  if (propertyKey !== undefined) {
    return Object.getOwnPropertyDescriptor(target, propertyKey);
  }

  return target;
}) as any;
