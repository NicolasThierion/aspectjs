import { AnnotationType } from '@aspectjs/common';
import { ASPECTJS_HTTP_ANNOTATION_FACTORY } from '../annotation-factory';

export const Delete = ASPECTJS_HTTP_ANNOTATION_FACTORY.create(
  AnnotationType.METHOD,
  // @ts-ignore
  // eslint-disable @typescript-eslint/no-unused-vars
  function Delete(url?: string, init?: RequestInit) {},
);
