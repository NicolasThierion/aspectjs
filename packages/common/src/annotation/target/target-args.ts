import {
  getPrototype,
  isFunction,
  isNumber,
  isObject,
  isUndefined,
} from '@aspectjs/common/utils';
import { DecoratorType } from '../annotation.types';
import type { Prototype } from './annotation-target';

export interface DecoratorLocation {
  proto: Prototype;
  propertyKey?: string;
  parameterIndex?: number;
}

export abstract class DecoratorTargetArgs<
  T extends DecoratorType = DecoratorType,
> implements DecoratorLocation
{
  readonly proto!: Prototype;
  readonly type!: T;
  readonly propertyKey?: string;
  readonly parameterIndex?: number;
  readonly descriptor?: PropertyDescriptor;

  static of<T extends DecoratorType = DecoratorType>(
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
): DecoratorType {
  let type: DecoratorType;
  if (isNumber(parameterIndex)) {
    type = DecoratorType.PARAMETER;
  } else if (!isUndefined(propertyKey)) {
    if (isObject(descriptor) && isFunction(descriptor.value)) {
      type = DecoratorType.METHOD;
    } else {
      type = DecoratorType.PROPERTY;
    }
  } else {
    type = DecoratorType.CLASS;
  }

  return type;
}
