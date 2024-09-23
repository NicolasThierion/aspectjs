import { AnnotationKind } from '@aspectjs/common';
import type { Put as NPut } from '@nestjs/common';
import { NESTJS_COMMON_ANNOTATION_FACTORY } from '../annotation-factory.global';
import { ReplaceReturnType } from '../type.utils';

export const Put = NESTJS_COMMON_ANNOTATION_FACTORY.create(
  AnnotationKind.METHOD,
  'Put',
  function () {} as ReplaceReturnType<typeof NPut, void>,
);
