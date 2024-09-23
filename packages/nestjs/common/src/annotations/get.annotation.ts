import { AnnotationKind } from '@aspectjs/common';
import type { Get as NGet } from '@nestjs/common';
import { NESTJS_COMMON_ANNOTATION_FACTORY } from '../annotation-factory.global';
import { ReplaceReturnType } from '../type.utils';

export const Get = NESTJS_COMMON_ANNOTATION_FACTORY.create(
  AnnotationKind.METHOD,
  'Get',
  function () {} as ReplaceReturnType<typeof NGet, void>,
);
