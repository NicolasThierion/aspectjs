import { ANNOTATION_FACTORY } from './annotation-factory';
import { AnnotationKind } from '@aspectjs/common';

export const NotBlank = ANNOTATION_FACTORY.create(
  AnnotationKind.PROPERTY,
  'NotBlank'
);
