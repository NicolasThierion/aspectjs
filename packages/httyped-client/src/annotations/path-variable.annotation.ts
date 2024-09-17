/* eslint-disable @typescript-eslint/no-unused-vars */
import { AnnotationKind } from '@aspectjs/common';
import { ASPECTJS_HTTP_ANNOTATION_FACTORY } from './annotation-factory';
export const PathVariable = ASPECTJS_HTTP_ANNOTATION_FACTORY.create(
  AnnotationKind.PARAMETER,
  function PathVariable(name: string) {},
);
