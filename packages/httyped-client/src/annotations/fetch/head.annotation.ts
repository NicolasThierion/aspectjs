/* eslint-disable @typescript-eslint/no-unused-vars */

import { AnnotationKind } from '@aspectjs/common';
import { ASPECTJS_HTTP_ANNOTATION_FACTORY } from '../annotation-factory';

export const Head = ASPECTJS_HTTP_ANNOTATION_FACTORY.create(
  AnnotationKind.METHOD,
  'Head',
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  function (url?: string, init?: RequestInit) {},
);
