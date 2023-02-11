import type { TargetType } from '@aspectjs/common';

export enum PointcutTargetType {
  CLASS = 'class',
  METHOD = 'method',
  GET_PROPERTY = 'get property',
  SET_PROPERTY = 'set property',
  PARAMETER = 'parameter',
}

export type ToTargetType<T extends PointcutTargetType> =
  T extends PointcutTargetType.GET_PROPERTY
    ? TargetType.PROPERTY
    : T extends PointcutTargetType.SET_PROPERTY
    ? TargetType.PROPERTY
    : T extends PointcutTargetType.CLASS
    ? TargetType.CLASS
    : T extends PointcutTargetType.METHOD
    ? TargetType.METHOD
    : T extends PointcutTargetType.PARAMETER
    ? TargetType.PARAMETER
    : never;
