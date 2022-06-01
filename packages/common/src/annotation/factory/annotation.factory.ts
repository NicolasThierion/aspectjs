/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-function */

import { assert, isFunction } from '@aspectjs/common/utils';
import {
  Annotation,
  AnnotationType,
  AnyDecorator,
  Decorator,
} from '../annotation.types';
import type { AnnotationStub } from '../annotation.types';
import { AnnotationRef } from '../annotation-ref';
import { reflectContext } from '../../reflect/reflect.context';

let anonymousAnnotationId = 0;

interface AnnotationCreateOptions<
  T extends AnnotationType,
  S extends AnnotationStub<T>,
> {
  name?: string;
  annotationStub?: S;
  type?: T;
}
/**
 * Factory to create an {@link Annotation}.
 * @public
 */
export class AnnotationFactory {
  readonly groupId: string;

  constructor(groupId: string) {
    this.groupId = groupId;
  }
  create<T extends AnnotationType, S extends AnnotationStub<T>>(
    type?: T,
    name?: string,
  ): Annotation<T, S>;

  create<S extends AnnotationStub<AnnotationType.ANY>>(
    name?: string,
  ): Annotation<AnnotationType.ANY, S>;

  create<T extends AnnotationType, S extends AnnotationStub<T>>(
    type?: T,
    annotationStub?: S,
  ): Annotation<T, S>;

  create<S extends AnnotationStub<AnnotationType.ANY>>(
    annotationStub?: S,
  ): Annotation<AnnotationType.ANY, S>;

  create<T extends AnnotationType, S extends AnnotationStub<T>>(
    init?: AnnotationCreateOptions<T, S>,
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
  _createDecorator<T extends AnnotationType, S extends AnnotationStub<T>>(
    annotation: Annotation<T, S>,
    annotationStub: S,
    annotationArgs: any[],
  ): Decorator {
    return function (
      this: any,
      ...targetArgs: any[]
    ): Function | PropertyDescriptor | void {
      return [
        ...reflectContext().get('annotationFactoryHooksRegistry').values(),
      ]
        .sort(
          (c1, c2) =>
            (c1.order ?? Number.MAX_SAFE_INTEGER) -
            (c2.order ?? Number.MAX_SAFE_INTEGER - 1),
        )
        .reduce((decoree, { name, decorator }) => {
          try {
            decoree =
              (decorator as any)
                .apply(this, [annotation, annotationArgs, annotationStub])
                ?.apply(this, targetArgs) ?? decoree;
            return decoree;
          } catch (e) {
            console.error(
              `Error applying annotation hook ${name}: ${(e as Error).message}`,
            );
            throw e;
          }
        }, noopDecorator.apply(this, targetArgs as any)) as any;
    };
  }

  _createAnnotation<T extends AnnotationType, S extends AnnotationStub<T>>(
    groupId: string,
    name: string,
    stub: S,
  ): Annotation<T, S> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _factory = this;
    const annotationRef = new AnnotationRef(groupId, name);
    const annotation = function (...annotationArgs: any[]): Decorator {
      return _factory._createDecorator(annotation, stub, annotationArgs);
    } as any as Annotation<T, S>;

    Object.defineProperties(annotation, Object.getOwnPropertyDescriptors(stub));
    Object.defineProperties(
      annotation,
      Object.getOwnPropertyDescriptors(annotationRef),
    );
    assert(
      Object.getOwnPropertySymbols(annotation).indexOf(Symbol.toPrimitive) >= 0,
    );

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
