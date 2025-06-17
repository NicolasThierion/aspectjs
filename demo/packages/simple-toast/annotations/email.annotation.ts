import { AnnotationKind } from '@aspectjs/common';
import { ANNOTATION_FACTORY } from './annotation-factory';

export const Email = ANNOTATION_FACTORY.create(
  AnnotationKind.PROPERTY,
  'Email'
);
