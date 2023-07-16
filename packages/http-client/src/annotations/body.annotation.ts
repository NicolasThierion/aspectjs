import { AnnotationType } from '@aspectjs/common';
import { ASPECTJS_HTTP_ANNOTATION_FACTORY } from './annotation-factory';
export const Body = ASPECTJS_HTTP_ANNOTATION_FACTORY.create(
  AnnotationType.PARAMETER,
  function Body() {},
);
