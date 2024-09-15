import type { AnnotationKind } from '@aspectjs/common';

export enum PointcutKind {
  CLASS = 'class',
  METHOD = 'method',
  GET_PROPERTY = 'get property',
  SET_PROPERTY = 'set property',
  PARAMETER = 'parameter',
  ANY = 'any',
}

export type ToAnnotationKind<T extends PointcutKind> = T extends
  | PointcutKind.GET_PROPERTY
  | PointcutKind.SET_PROPERTY
  ? AnnotationKind.PROPERTY
  : T extends PointcutKind.CLASS
  ? AnnotationKind.CLASS
  : T extends PointcutKind.METHOD
  ? AnnotationKind.METHOD
  : T extends PointcutKind.PARAMETER
  ? AnnotationKind.PARAMETER
  : any;
