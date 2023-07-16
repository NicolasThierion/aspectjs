import { AnnotationType } from '@aspectjs/common';
import { ASPECTJS_HTTP_ANNOTATION_FACTORY } from '../annotation-factory';
export const Patch = ASPECTJS_HTTP_ANNOTATION_FACTORY.create(
  AnnotationType.METHOD,
  function Patch(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    path?: string,
  ) {},
);
