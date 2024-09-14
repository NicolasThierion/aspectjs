import {
  ConstructorType,
  Prototype,
  getPrototype,
  isClassInstance,
  isFunction,
  isNumber,
  isObject,
  isUndefined,
} from '@aspectjs/common/utils';
import { BoundAnnotationTarget } from './bound-annotation-target';

import { AnnotationKind } from '../annotation.types';
import { AnnotationTarget } from './annotation-target';
import { _AnnotationTargetImpl } from './annotation-target.impl';
import { _findPropertyDescriptor } from './annotation-target.utils';
import { _ClassAnnotationTargetImpl } from './impl/class-annotation-target.impl';
import { _MethodAnnotationTargetImpl } from './impl/method-annotation-target.impl';
import { _ParameterAnnotationTargetImpl } from './impl/parameter-annotation-target.impl';
import { _PropertyAnnotationTargetImpl } from './impl/property-annotation-target.impl';

const _TARGET_GENERATORS: {
  [t in AnnotationKind]: (...args: any[]) => AnnotationTarget<t>;
} = {
  [AnnotationKind.CLASS]: _ClassAnnotationTargetImpl.of,
  [AnnotationKind.PROPERTY]: _PropertyAnnotationTargetImpl.of,
  [AnnotationKind.METHOD]: _MethodAnnotationTargetImpl.of,
  [AnnotationKind.PARAMETER]: _ParameterAnnotationTargetImpl.of,
};

/**
 * Create {@link AnnotationTarget}
 */
export class AnnotationTargetFactory {
  of<X = unknown>(
    target: ConstructorType<X>,
  ): AnnotationTarget<AnnotationKind.CLASS, X>;
  of<X = unknown>(target: X): BoundAnnotationTarget<AnnotationKind.CLASS, X>;

  of<X = unknown>(
    target: ConstructorType<X>,
    propertyKey: keyof X,
  ): AnnotationTarget<AnnotationKind.PROPERTY, X>;
  of<X = unknown>(
    target: X,
    propertyKey: keyof X,
  ): BoundAnnotationTarget<AnnotationKind.PROPERTY, X>;

  of<X = unknown>(
    target: ConstructorType<X>,
    propertyKey: keyof X,
    descriptor: PropertyDescriptor,
  ): AnnotationTarget<AnnotationKind.METHOD, X>;
  of<X = unknown>(
    target: X,
    propertyKey: keyof X,
    descriptor: PropertyDescriptor,
  ): BoundAnnotationTarget<AnnotationKind.METHOD, X>;

  of<X = unknown>(
    target: ConstructorType<X>,
    propertyKey: keyof X,
    parameterIndex: number,
  ): AnnotationTarget<AnnotationKind.PARAMETER, X>;

  of<T extends AnnotationKind = AnnotationKind, X = unknown>(
    ...args: unknown[]
  ): AnnotationTarget<T, X> {
    // ClassAnnotation = <TFunction extends Function>(target: TFunction) => TFunction | void;
    // PropertyAnnotation = (target: Object, propertyKey: string | symbol) => void;
    // MethodAnnotation = <A>(target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<A>) => TypedPropertyDescriptor<A> | void;
    // ParameterAnnotation = (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;

    const target = args[0] as ConstructorType<X> | Prototype<X>;
    let classInstance: X | undefined;

    const propertyKey: string | symbol | undefined = isUndefined(args[1])
      ? undefined
      : (args[1] as string | symbol);
    const parameterIndex: number | undefined = isNumber(args[2])
      ? args[2]
      : undefined;
    const descriptor: PropertyDescriptor | undefined = isObject(args[2])
      ? args[2]
      : undefined;

    const type = inferTypeFromArgs(
      target,
      propertyKey,
      parameterIndex,
      descriptor,
    ) as T;

    if (isClassInstance(target)) {
      // target is a class instance. Decoree should be the class ctor for type=CLASS, or the class proto for type=METHOD/PROPERTY/PARAMETER
      args[0] =
        type === AnnotationKind.CLASS
          ? getPrototype(target).constructor
          : getPrototype(target);
      classInstance = target as X;
    }
    if (!args[2] && type === AnnotationKind.METHOD) {
      // Get the property descriptor if missing from args
      args[2] = _findPropertyDescriptor(args[0] as Prototype<X>, propertyKey!);
    }

    const annotationTarget = _TARGET_GENERATORS[type](...args);

    return classInstance
      ? (annotationTarget as unknown as _AnnotationTargetImpl<T, X>)._bind(
          classInstance as X,
        )
      : (annotationTarget as AnnotationTarget<T, X>);
  }
}

export function inferTypeFromArgs(...args: unknown[]): AnnotationKind;
export function inferTypeFromArgs<X = unknown>(
  decoree: ConstructorType<X> | Prototype<X>,
  propertyKey?: string | symbol,
  parameterIndex?: number,
  descriptor?: PropertyDescriptor,
): AnnotationKind;
export function inferTypeFromArgs<X = unknown>(...args: any[]): AnnotationKind {
  const [decoree, propertyKey, parameterIndex, descriptor]: [
    ConstructorType<X> | Prototype<X>,
    string | symbol,
    number,
    PropertyDescriptor,
  ] = args as any;

  let kind: AnnotationKind;
  if (isNumber(parameterIndex)) {
    kind = AnnotationKind.PARAMETER;
  } else if (!isUndefined(propertyKey)) {
    if (isObject(descriptor) && isFunction(descriptor.value)) {
      kind = AnnotationKind.METHOD;
    } else {
      kind = AnnotationKind.PROPERTY;

      // if called of(x, "method"), while method is a method, replace propertyKey with descriptor
      const descriptor = _findPropertyDescriptor(decoree, propertyKey!);

      if (typeof descriptor?.value === 'function') {
        kind = AnnotationKind.METHOD;
      }
    }
  } else {
    kind = AnnotationKind.CLASS;
  }

  return kind;
}
