import { ConstructorType, getPrototype } from '@aspectjs/common/utils';
import { BoundAnnotationTarget } from './bound-annotation-target';

import { AnnotationType } from '../annotation.types';
import { AnnotationTarget } from './annotation-target';
import { _AnnotationTargetImpl } from './annotation-target.impl';
import {
  _findOrCreateAnnotationTarget,
  _findPropertyDescriptor,
} from './annotation-target.utils';
import { DecoratorTargetArgs } from './target-args';

let _factoryId = 0;

/**
 * Create {@link AnnotationTarget}
 */
export class AnnotationTargetFactory {
  readonly id = _factoryId++;

  of<T extends AnnotationType, X>(
    args: DecoratorTargetArgs<T, X>,
  ): AnnotationTarget<T, X>;

  of<X = unknown>(
    target: ConstructorType<X>,
  ): AnnotationTarget<AnnotationType.CLASS, X>;
  of<X = unknown>(target: X): BoundAnnotationTarget<AnnotationType.CLASS, X>;

  of<X = unknown>(
    target: ConstructorType<X>,
    propertyKey: keyof X,
  ): AnnotationTarget<AnnotationType.PARAMETER, X>;
  of<X = unknown>(
    target: X,
    propertyKey: keyof X,
  ): BoundAnnotationTarget<AnnotationType.PARAMETER, X>;

  of<X = unknown>(
    target: ConstructorType<X>,
    propertyKey: keyof X,
    descriptor: PropertyDescriptor,
  ): AnnotationTarget<AnnotationType.METHOD, X>;
  of<X = unknown>(
    target: X,
    propertyKey: keyof X,
    descriptor: PropertyDescriptor,
  ): BoundAnnotationTarget<AnnotationType.METHOD, X>;

  of<X = unknown>(
    target: ConstructorType<X>,
    propertyKey: keyof X,
    parameterIndex: number,
  ): AnnotationTarget<AnnotationType.PARAMETER, X>;

  // of<X = unknown>(
  //   target: X,
  //   propertyKey: keyof X,
  //   parameterIndex: number,
  // ): BoundAnnotationTarget<AnnotationType.PARAMETER, X>;

  of<T extends AnnotationType = AnnotationType, X = unknown>(
    ...args: unknown[]
  ): AnnotationTarget<T, X> {
    if (args[0] instanceof DecoratorTargetArgs) {
      return _findOrCreateAnnotationTarget(
        this,
        args[0] as DecoratorTargetArgs<T, X>,
      );
    }

    // ClassAnnotation = <TFunction extends Function>(target: TFunction) => TFunction | void;
    // PropertyAnnotation = (target: Object, propertyKey: string | symbol) => void;
    // MethodAnnotation = <A>(target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<A>) => TypedPropertyDescriptor<A> | void;
    // ParameterAnnotation = (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;

    const targetArgs = coerce(DecoratorTargetArgs.of<T, X>(args));

    const target = _findOrCreateAnnotationTarget(this, targetArgs);

    if (isClassInstance(args[0])) {
      return (target as unknown as _AnnotationTargetImpl<T, X>).bind(args[0]);
    }
    return target;
  }
}
function isClassInstance(obj: any): boolean {
  return (
    typeof obj === 'object' && getPrototype(obj) === Object.getPrototypeOf(obj)
  );
}
function coerce<T extends AnnotationType, X = unknown>(
  targetArgs: DecoratorTargetArgs<T, X>,
) {
  // if called of(x, "method"), while method is a method, replace propertyKey with descriptor
  if (targetArgs.type === AnnotationType.PROPERTY) {
    const descriptor = _findPropertyDescriptor(
      targetArgs.proto,
      targetArgs.propertyKey!,
    );

    if (typeof descriptor?.value === 'function') {
      targetArgs = {
        ...targetArgs,
        type: AnnotationType.METHOD as T,
        descriptor,
      };
    }
  }

  return targetArgs;
}
