/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-function */
import { assert, isFunction } from '../../utils';
import {
  Annotation,
  AnnotationRef,
  AnnotationType,
  AnyDecorator,
  Decorator,
} from '../annotation.types';
import type { AnnotationStub } from './../annotation.types';

let anonymousAnnotationId = 0;

/**
 * An AnnotationHook is a configuration to link annotations to a typescript decorator.
 */
export type AnnotationsHook<
  T extends AnnotationType = AnnotationType,
  S extends AnnotationStub<T> = AnnotationStub<T>
> = {
  decorator: (
    annotation: Annotation<T>,
    annotationArgs: any[],
    annotationStub: S
  ) => Decorator | void;
  order: number;
  name: string;
};

/**
 * Factory to create an {@link Annotation}.
 * @public
 */
export class AnnotationFactory {
  readonly groupId: string;

  private static readonly _hooks: Map<string, AnnotationsHook> = new Map([
    [
      '@aspectjs::hook:annotationStub',
      {
        name: '@aspectjs::hook:annotationStub',
        order: 0,
        decorator: (_annotation, annotationArgs, annotationStub) => {
          return annotationStub(...annotationArgs);
        },
      },
    ],
  ]);

  static addAnnotationsHook(annotationsHook: AnnotationsHook) {
    assert(!!annotationsHook.name);
    AnnotationFactory._hooks.set(annotationsHook.name, annotationsHook);
  }
  constructor(groupId: string) {
    this.groupId = groupId;
  }

  create<T extends AnnotationType, S extends AnnotationStub<T>>(
    name?: string | S,
    annotationStub?: S
  ): Annotation<T, S> {
    const groupId = this.groupId;

    if (isFunction(name)) {
      annotationStub = name as S;
      name = annotationStub.name;
    }
    if (!annotationStub) {
      annotationStub = function () {} as S;
    }
    if (!name) {
      name = `anonymousAnnotation#${anonymousAnnotationId++}`;
    }

    // create the annotation (ie: decorator factory)
    return this._createAnnotation(groupId, name, annotationStub);
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
      return [...AnnotationFactory._hooks.values()]
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
              `Error applying bootstrap decorator ${name}: ${
                (e as Error).message
              }`
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
