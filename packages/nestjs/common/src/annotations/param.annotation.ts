import { AnnotationType } from '@aspectjs/common';
import { Param as NParam } from '@nestjs/common';
import { NESTJS_COMMON_ANNOTATION_FACTORY } from '../annotation-factory.global';
import { ReplaceReturnType } from '../type.utils';

export const Param = NESTJS_COMMON_ANNOTATION_FACTORY.create(
  AnnotationType.METHOD,
  function Param() {} as ReplaceReturnType<typeof NParam, void>,
);
