import { AnnotationType } from '@aspectjs/common';
import { Query as NQuery } from '@nestjs/common';
import { NESTJS_COMMON_ANNOTATION_FACTORY } from '../annotation-factory.global';
import { ReplaceReturnType } from '../type.utils';

export const Query = NESTJS_COMMON_ANNOTATION_FACTORY.create(
  AnnotationType.METHOD,
  function Query() {} as ReplaceReturnType<typeof NQuery, void>,
);
