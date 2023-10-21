import type { AnnotationType } from '@aspectjs/common';

export enum PointcutType {
  CLASS = 'class',
  METHOD = 'method',
  GET_PROPERTY = 'get property',
  SET_PROPERTY = 'set property',
  PARAMETER = 'parameter',
  ANY = 'any',
}

export type ToAnnotationType<T extends PointcutType> = T extends
  | PointcutType.GET_PROPERTY
  | PointcutType.SET_PROPERTY
  ? AnnotationType.PROPERTY
  : T extends PointcutType.CLASS
  ? AnnotationType.CLASS
  : T extends PointcutType.METHOD
  ? AnnotationType.METHOD
  : T extends PointcutType.PARAMETER
  ? AnnotationType.PARAMETER
  : any;
