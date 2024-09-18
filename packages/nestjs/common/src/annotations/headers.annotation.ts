import { AnnotationKind } from '@aspectjs/common';
import type { Headers as NHeaders } from '@nestjs/common';
import { NESTJS_COMMON_ANNOTATION_FACTORY } from '../annotation-factory.global';
import { ReplaceReturnType } from '../type.utils';

export const Headers = NESTJS_COMMON_ANNOTATION_FACTORY.create(
  AnnotationKind.METHOD,
  function Headers() {} as ReplaceReturnType<typeof NHeaders, void>,
);
