/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-function */

import { assert, isFunction } from '@aspectjs/common/utils';
import type {
  Annotation,
  AnnotationType,
  AnyDecorator,
  Decorator,
} from '../annotation.types';
import type { AnnotationStub } from '../annotation.types';
import { AnnotationRef } from '../annotation-ref';
import { reflectContext } from '../../reflect/context';

let anonymousAnnotationId = 0;

interface AnnotationCreateOptions<T extends AnnotationType, S> {
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
  create<
    T extends AnnotationType = AnnotationType.ANY,
    S extends AnnotationStub<T> = () => void
  >(name?: string, annotationStub?: S): Annotation<T, S>;
  create<
    T extends AnnotationType = AnnotationType.ANY,
    S extends AnnotationStub<T> = () => void
  >(annotationStub?: S): Annotation<T, S>;
  create<
    T extends AnnotationType = AnnotationType.ANY,
    S extends AnnotationStub<T> = () => void
  >(opts: AnnotationCreateOptions<T, S>): Annotation<T, S>;
  create<
    T extends AnnotationType = AnnotationType.ANY,
    S extends AnnotationStub<T> = () => void
  >(
    opts?: string | S | AnnotationCreateOptions<T, S>,
    annotationStub?: S
  ): Annotation<T, S> {
    const _opts = typeof opts === 'object' ? opts : {};

    if (typeof annotationStub === 'function') {
      _opts.name = annotationStub.name;
    }
    if (typeof opts === 'string') {
      _opts.name = opts;
      _opts.annotationStub = annotationStub;
    } else if (typeof opts === 'function') {
      _opts.name = opts.name;
      _opts.annotationStub = opts;
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
    annotationArgs: any[]
  ): Decorator {
    return function (
      this: any,
      ...targetArgs: any[]
    ): Function | PropertyDescriptor | void {
      return [...reflectContext().get('annotationsHooksRegistry').values()]
        .sort((c1, c2) => c1.order - c2.order)
        .reduce((decoree, { name, decorator }) => {
          try {
            decoree =
              (decorator as any)
                .apply(this, [annotation, annotationArgs, annotationStub])
                ?.apply(this, targetArgs) ?? decoree;
            return decoree;
          } catch (e) {
            console.error(
              `Error applying annotation hook ${name}: ${(e as Error).message}`
            );
            throw e;
          }
        }, noopDecorator.apply(this, targetArgs as any)) as any;
    };
  }

  _createAnnotation<T extends AnnotationType, S extends AnnotationStub<T>>(
    groupId: string,
    name: string,
    stub: S
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
      Object.getOwnPropertyDescriptors(annotationRef)
    );
    assert(
      Object.getOwnPropertySymbols(annotation).indexOf(Symbol.toPrimitive) >= 0
    );

    return annotation;
  }
}

const noopDecorator: AnyDecorator = (<TFunction extends Function>(
  target: TFunction,
  propertyKey: string | symbol,
  _parameterIndex: number
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
