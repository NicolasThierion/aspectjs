import { AnnotationType } from '@aspectjs/common';
import { Options as NOptions } from '@nestjs/common';
import { NESTJS_COMMON_ANNOTATION_FACTORY } from '../annotation-factory.global';
import { ReplaceReturnType } from '../type.utils';

export const Options = NESTJS_COMMON_ANNOTATION_FACTORY.create(
  AnnotationType.METHOD,
  function Options() {} as ReplaceReturnType<typeof NOptions, void>,
);
