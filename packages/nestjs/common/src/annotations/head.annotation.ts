import { AnnotationType } from '@aspectjs/common';
import { Head as NHead } from '@nestjs/common';
import { NESTJS_COMMON_ANNOTATION_FACTORY } from '../annotation-factory.global';
import { ReplaceReturnType } from '../type.utils';

export const Head = NESTJS_COMMON_ANNOTATION_FACTORY.create(
  AnnotationType.METHOD,
  function Head() {} as ReplaceReturnType<typeof NHead, void>,
);
