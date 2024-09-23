/* eslint-disable @typescript-eslint/no-unused-vars */
import { AnnotationKind } from '@aspectjs/common';
import { ASPECTJS_HTTP_ANNOTATION_FACTORY } from './annotation-factory';
export const PathVariable = ASPECTJS_HTTP_ANNOTATION_FACTORY.create(
  AnnotationKind.PARAMETER,
  'PathVariable',
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  function (name: string) {},
);
