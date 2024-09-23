import { AnnotationKind } from '@aspectjs/common';
import type { Head as NHead } from '@nestjs/common';
import { NESTJS_COMMON_ANNOTATION_FACTORY } from '../annotation-factory.global';
import { ReplaceReturnType } from '../type.utils';

export const Head = NESTJS_COMMON_ANNOTATION_FACTORY.create(
  AnnotationKind.METHOD,
  'Head',
  function () {} as ReplaceReturnType<typeof NHead, void>,
);
