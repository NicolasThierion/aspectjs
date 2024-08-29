import { AnnotationType } from '@aspectjs/common';
import { ASPECTJS_HTTP_ANNOTATION_FACTORY } from '../annotation-factory';

// eslint-disable @typescript-eslint/no-unused-vars

export const Option = ASPECTJS_HTTP_ANNOTATION_FACTORY.create(
  AnnotationType.METHOD,
  function Option(url?: string, init?: RequestInit) {},
);
