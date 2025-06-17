import { AnnotationKind } from '@aspectjs/common';
import { ANNOTATION_FACTORY } from './annotation-factory';

export const MinLength = ANNOTATION_FACTORY.create(
  AnnotationKind.PROPERTY,
  'MinLength',
  function (value: number) {}
);
