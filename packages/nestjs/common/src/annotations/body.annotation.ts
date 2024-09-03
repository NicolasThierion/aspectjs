import { AnnotationType } from '@aspectjs/common';
import { Body as NBody } from '@nestjs/common';
import { NESTJS_COMMON_ANNOTATION_FACTORY } from '../annotation-factory.global';
import { ReplaceReturnType } from '../type.utils';

export const Body = NESTJS_COMMON_ANNOTATION_FACTORY.create(
  AnnotationType.PARAMETER,
  function Body() {} as ReplaceReturnType<typeof NBody, void>,
);
