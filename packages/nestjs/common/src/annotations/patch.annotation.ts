import { AnnotationKind } from '@aspectjs/common';
import type { Patch as NPatch } from '@nestjs/common';
import { NESTJS_COMMON_ANNOTATION_FACTORY } from '../annotation-factory.global';
import { ReplaceReturnType } from '../type.utils';

export const Patch = NESTJS_COMMON_ANNOTATION_FACTORY.create(
  AnnotationKind.METHOD,
  'Patch',
  function () {} as ReplaceReturnType<typeof NPatch, void>,
);
