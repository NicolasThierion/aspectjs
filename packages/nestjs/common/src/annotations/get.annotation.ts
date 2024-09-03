import { AnnotationType } from '@aspectjs/common';
import { Get as NGet } from '@nestjs/common';
import { NESTJS_COMMON_ANNOTATION_FACTORY } from '../annotation-factory.global';
import { ReplaceReturnType } from '../type.utils';

export const Get = NESTJS_COMMON_ANNOTATION_FACTORY.create(
  AnnotationType.METHOD,
  function Get() {} as ReplaceReturnType<typeof NGet, void>,
);
