import { AnnotationType } from '@aspectjs/common';
import { ASPECTJS_HTTP_ANNOTATION_FACTORY } from '../annotation-factory';

// eslint-disable @typescript-eslint/no-unused-vars

export const Head = ASPECTJS_HTTP_ANNOTATION_FACTORY.create(
  AnnotationType.METHOD,
  function Head(url?: string, init?: RequestInit) {},
);
