import { AnnotationKind } from '@aspectjs/common';
import { Delete as NDelete } from '@nestjs/common';
import { NESTJS_COMMON_ANNOTATION_FACTORY } from '../annotation-factory.global';
import { ReplaceReturnType } from '../type.utils';

export const Delete = NESTJS_COMMON_ANNOTATION_FACTORY.create(
  AnnotationKind.METHOD,
  function Delete() {} as ReplaceReturnType<typeof NDelete, void>,
);
