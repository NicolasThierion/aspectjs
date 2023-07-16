import { AnnotationType } from '@aspectjs/common';
import { HttpClientConfig } from '../http-client-config.type';
import { ASPECTJS_HTTP_ANNOTATION_FACTORY } from './annotation-factory';
export const HttpClient = ASPECTJS_HTTP_ANNOTATION_FACTORY.create(
  AnnotationType.CLASS,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function HttpClient(config?: HttpClientConfig | string) {},
);
