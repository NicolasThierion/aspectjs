import { AnnotationKind } from '@aspectjs/common';
import type { Injectable as NInjectable } from '@nestjs/common';
import { NESTJS_COMMON_ANNOTATION_FACTORY } from '../annotation-factory.global';
import { ReplaceReturnType } from '../type.utils';

export const Injectable = NESTJS_COMMON_ANNOTATION_FACTORY.create(
  AnnotationKind.CLASS,
  function Injectable() {} as ReplaceReturnType<typeof NInjectable, void>,
);
