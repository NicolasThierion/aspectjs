import { AnnotationType } from '@aspectjs/common';
import { ASPECTJS_HTTP_ANNOTATION_FACTORY } from './annotation-factory';
export const RequestParams = ASPECTJS_HTTP_ANNOTATION_FACTORY.create(
  AnnotationType.PARAMETER,
  function RequestParams(
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params: Map<string, any> | Record<string, any> | object,
  ) {},
);
