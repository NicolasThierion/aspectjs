import { AnnotationKind } from '@aspectjs/common';
import { ASPECTJS_HTTP_ANNOTATION_FACTORY } from './annotation-factory';
export const RequestParams = ASPECTJS_HTTP_ANNOTATION_FACTORY.create(
  AnnotationKind.PARAMETER,
  function RequestParams() {},
);
