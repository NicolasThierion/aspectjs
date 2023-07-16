import { AnnotationType } from '@aspectjs/common';
import { ASPECTJS_HTTP_ANNOTATION_FACTORY } from './annotation-factory';
export const PathVariable = ASPECTJS_HTTP_ANNOTATION_FACTORY.create(
  AnnotationType.PARAMETER,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function PathVariable(name: string) {},
);
