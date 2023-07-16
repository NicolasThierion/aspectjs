import { AnnotationType } from '@aspectjs/common';
import { ASPECTJS_HTTP_ANNOTATION_FACTORY } from '../annotation-factory';
// eslint-disable @typescript-eslint/no-unused-vars

export const Get = ASPECTJS_HTTP_ANNOTATION_FACTORY.create(
  AnnotationType.METHOD,
  function Get(url?: string, init?: RequestInit) {},
);
