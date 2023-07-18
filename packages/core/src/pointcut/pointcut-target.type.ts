import type { AnnotationType } from '@aspectjs/common';

export enum JoinpointType {
  CLASS = 'class',
  METHOD = 'method',
  GET_PROPERTY = 'get property',
  SET_PROPERTY = 'set property',
  PARAMETER = 'parameter',
  ANY = 'any',
}

export type ToAnnotationType<T extends JoinpointType> = T extends
  | JoinpointType.GET_PROPERTY
  | JoinpointType.SET_PROPERTY
  ? AnnotationType.PROPERTY
  : T extends JoinpointType.CLASS
  ? AnnotationType.CLASS
  : T extends JoinpointType.METHOD
  ? AnnotationType.METHOD
  : T extends JoinpointType.PARAMETER
  ? AnnotationType.PARAMETER
  : any;
