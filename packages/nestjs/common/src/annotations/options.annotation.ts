import { AnnotationKind } from '@aspectjs/common';
import type { Options as NOptions } from '@nestjs/common';
import { NESTJS_COMMON_ANNOTATION_FACTORY } from '../annotation-factory.global';
import { ReplaceReturnType } from '../type.utils';

export const Options = NESTJS_COMMON_ANNOTATION_FACTORY.create(
  AnnotationKind.METHOD,
  'Options',
  function () {} as ReplaceReturnType<typeof NOptions, void>,
);
