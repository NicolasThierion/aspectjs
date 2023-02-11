import {
  getPrototype,
  isFunction,
  isNumber,
  isObject,
  isUndefined,
} from '@aspectjs/common/utils';
import { TargetType } from '../annotation.types';
import type { Prototype } from './annotation-target';

export interface DecoratorLocation<X = unknown> {
  proto: Prototype<X>;
  propertyKey?: string;
  parameterIndex?: number;
}

/**
 * Represents ts decorator arguments, used for creating the {@link AnnotationTarget}
 */
export abstract class DecoratorTargetArgs<
  T extends TargetType = TargetType,
  X = unknown,
> implements DecoratorLocation
{
  readonly proto!: Prototype<X>;
  readonly type!: T;
  readonly propertyKey?: string;
  readonly parameterIndex?: number;
  readonly descriptor?: PropertyDescriptor;

  static of<T extends TargetType = TargetType>(
    decoratorArgs: any[],
  ): DecoratorTargetArgs<T> {
    // ClassAnnotation = <TFunction extends Function>(target: TFunction) => TFunction | void;
    // PropertyAnnotation = (target: Object, propertyKey: string | symbol) => void;
    // MethodAnnotation = <A>(target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<A>) => TypedPropertyDescriptor<A> | void;
    // ParameterAnnotation = (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;

    // eslint-disable-next-line @typescript-eslint/ban-types
    const target: Function | object = decoratorArgs[0];
    const propertyKey: string | undefined = isUndefined(decoratorArgs[1])
      ? undefined
      : String(decoratorArgs[1]);
    const parameterIndex: number | undefined = isNumber(decoratorArgs[2])
      ? decoratorArgs[2]
      : undefined;
    const proto = getPrototype(target);
    const descriptor: PropertyDescriptor | undefined = isObject(
      decoratorArgs[2],
    )
      ? decoratorArgs[2]
      : undefined;

    const type = inferTypeFromArgs(
      propertyKey,
      parameterIndex,
      descriptor,
    ) as T;

    return {
      proto,
      propertyKey,
      parameterIndex,
      descriptor,
      type,
    };
  }
}

function inferTypeFromArgs(
  propertyKey?: string,
  parameterIndex?: number,
  descriptor?: PropertyDescriptor,
): TargetType {
  let type: TargetType;
  if (isNumber(parameterIndex)) {
    type = TargetType.PARAMETER;
  } else if (!isUndefined(propertyKey)) {
    if (isObject(descriptor) && isFunction(descriptor.value)) {
      type = TargetType.METHOD;
    } else {
      type = TargetType.PROPERTY;
    }
  } else {
    type = TargetType.CLASS;
  }

  return type;
}
