import { isFunction } from '@aspectjs/common/utils';

import { AnnotationRef } from '../annotation-ref';
import {
  Annotation,
  AnnotationType,
  AnyDecorator,
  Decorator,
} from '../annotation.types';
import { annotationsContext } from '../context/annotations.context.global';
import { _AnnotationFactoryHookRegistry } from './annotations-hooks.registry';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-function */

import type { AnnotationStub } from '../annotation.types';
let anonymousAnnotationId = 0;

/**
 * Options given to the AnnotationFactory to create a new annotation.
 * @param T The type of annotation to create.
 * @param S The signature of the annotation to create.
 */
export interface AnnotationCreateOptions<
  T extends AnnotationType,
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
  constructor(
    /**
     * The group of this factory.
     * All annotations created by this factory will belong to this group.
     */
    public readonly groupId: string,
  ) {}

  /**
   * Creates a new annotation.
   * @param type The type of annotation to create.
   * @param name The name of the annotation to create.
   */
  create<T extends AnnotationType, S extends AnnotationStub<T>>(
    type?: T,
    name?: string,
  ): Annotation<T, S>;

  /**
   * Creates a new annotation.
   * @param name The name of the annotation to create.
   */
  create<S extends AnnotationStub<AnnotationType.ANY>>(
    name?: string,
  ): Annotation<AnnotationType.ANY, S>;

  /**
   * Creates a new annotation.
   * @param type The type of annotation to create.
   * @param annotationStub The signature of the annotation to create.
   */
  create<T extends AnnotationType, S extends AnnotationStub<T>>(
    type?: T,
    annotationStub?: S,
  ): Annotation<T, S>;

  /**
   * Creates a new annotation.
   * @param annotationStub The signature of the annotation to create.
   */
  create<S extends AnnotationStub<AnnotationType.ANY>>(
    annotationStub?: S,
  ): Annotation<AnnotationType.ANY, S>;

  /**
   * Creates a new annotation.
   * @param options The options for the annotation to create.
   */
  create<T extends AnnotationType, S extends AnnotationStub<T>>(
    options?: AnnotationCreateOptions<T, S>,
  ): Annotation<T, S>;
  create<T extends AnnotationType, S extends AnnotationStub<T>>(
    init?: string | S | AnnotationCreateOptions<T, S> | AnnotationType,
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
    } else if (typeof init === typeof AnnotationType) {
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
    T extends AnnotationType,
    S extends AnnotationStub<T>,
  >(
    annotation: Annotation<T, S>,
    annotationStub: S,
    annotationArgs: any[],
  ): Decorator {
    return function (
      this: any,
      ...targetArgs: any[]
    ): Function | PropertyDescriptor | void {
      return [
        ...annotationsContext().get(_AnnotationFactoryHookRegistry).values(),
      ]
        .sort(
          (c1, c2) =>
            (c1.order ?? Number.MAX_SAFE_INTEGER) -
            (c2.order ?? Number.MAX_SAFE_INTEGER - 1),
        )
        .reduce((decoree, { name, decorator }) => {
          try {
            const newDecoree =
              (decorator as any)
                .apply(this, [annotation, annotationArgs, annotationStub])
                ?.apply(this, targetArgs) ?? decoree;

            if (newDecoree) {
              Object.assign(newDecoree, decoree); // copy static props
            }
            return newDecoree;
          } catch (e) {
            console.error(
              `Error applying annotation hook ${name}: ${(e as Error).message}`,
            );
            throw e;
          }
        }, noopDecorator.apply(this, targetArgs as any)) as any;
    };
  }

  private _createAnnotation<
    T extends AnnotationType,
    S extends AnnotationStub<T>,
  >(groupId: string, name: string, stub: S): Annotation<T, S> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _factory = this;
    const annotationRef = new AnnotationRef(groupId, name);
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
    if (isFunction(target) && target.prototype) {
      return Object.getOwnPropertyDescriptor(target.prototype, propertyKey);
    } else {
      return;
    }
  }

  return target;
}) as any;
