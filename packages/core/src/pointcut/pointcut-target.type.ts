import type { AnnotationType, TargetType } from '@aspectjs/common';

export enum JoinpointType {
  CLASS = 'class',
  METHOD = 'method',
  GET_PROPERTY = 'get property',
  SET_PROPERTY = 'set property',
  PARAMETER = 'parameter',
  ANY = 'any',
}

export type ToTargetType<T extends JoinpointType | AnnotationType> = T extends
  | JoinpointType.GET_PROPERTY
  | JoinpointType.SET_PROPERTY
  | AnnotationType.PROPERTY
  ? TargetType.PROPERTY
  : T extends JoinpointType.CLASS | AnnotationType.CLASS
  ? TargetType.CLASS
  : T extends JoinpointType.METHOD | AnnotationType.METHOD
  ? TargetType.METHOD
  : T extends JoinpointType.PARAMETER | AnnotationType.PARAMETER
  ? TargetType.PARAMETER
  : T extends AnnotationType.ANY
  ? any
  : never;
