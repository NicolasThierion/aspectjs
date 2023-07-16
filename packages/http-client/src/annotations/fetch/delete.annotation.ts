import { AnnotationType } from '@aspectjs/common';
import { ASPECTJS_HTTP_ANNOTATION_FACTORY } from '../annotation-factory';
export const Delete = ASPECTJS_HTTP_ANNOTATION_FACTORY.create(
  AnnotationType.METHOD,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function Delete(path?: string) {},
);
