import { AnnotationType } from '@aspectjs/common';
import { Patch as NPatch } from '@nestjs/common';
import { NESTJS_COMMON_ANNOTATION_FACTORY } from '../annotation-factory.global';
import { ReplaceReturnType } from '../type.utils';

export const Patch = NESTJS_COMMON_ANNOTATION_FACTORY.create(
  AnnotationType.METHOD,
  function Patch() {} as ReplaceReturnType<typeof NPatch, void>,
);
