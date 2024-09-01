import { AnnotationType } from '@aspectjs/common';
import { ASPECTJS_HTTP_ANNOTATION_FACTORY } from './annotation-factory';
export const RequestParam = ASPECTJS_HTTP_ANNOTATION_FACTORY.create(
  AnnotationType.PARAMETER,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function RequestParam(name: string) {},
);
