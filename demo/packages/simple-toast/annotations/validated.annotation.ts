import { ANNOTATION_FACTORY } from './annotation-factory';
import { AnnotationKind } from '@aspectjs/common';

export const Validated = ANNOTATION_FACTORY.create(
  AnnotationKind.PARAMETER,
  'Validated'
);
