import { AnnotationType } from '@aspectjs/common';
import { ASPECTJS_HTTP_ANNOTATION_FACTORY } from '../annotation-factory';
export const Option = ASPECTJS_HTTP_ANNOTATION_FACTORY.create(
  AnnotationType.METHOD,
  function Option(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    path?: string,
  ) {},
);
