import { AnnotationKind } from '@aspectjs/common';
import { ASPECTJS_HTTP_ANNOTATION_FACTORY } from '../annotation-factory';

export const Put = ASPECTJS_HTTP_ANNOTATION_FACTORY.create(
  AnnotationKind.METHOD,
  // @ts-ignore
  // eslint-disable @typescript-eslint/no-unused-vars
  function Put(url?: string, init?: RequestInit) {},
);
