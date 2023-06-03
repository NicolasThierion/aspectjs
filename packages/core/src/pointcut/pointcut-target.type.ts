import type { AnnotationType, TargetType } from '@aspectjs/common';

export enum PointcutTargetType {
  CLASS = 'class',
  METHOD = 'method',
  GET_PROPERTY = 'get property',
  SET_PROPERTY = 'set property',
  PARAMETER = 'parameter',
}

export type ToTargetType<T extends PointcutTargetType | AnnotationType> =
  T extends
    | PointcutTargetType.GET_PROPERTY
    | PointcutTargetType.SET_PROPERTY
    | AnnotationType.PROPERTY
    ? TargetType.PROPERTY
    : T extends PointcutTargetType.CLASS | AnnotationType.CLASS
    ? TargetType.CLASS
    : T extends PointcutTargetType.METHOD | AnnotationType.METHOD
    ? TargetType.METHOD
    : T extends PointcutTargetType.PARAMETER | AnnotationType.PARAMETER
    ? TargetType.PARAMETER
    : T extends AnnotationType.ANY
    ? any
    : never;
