import { AnnotationKind } from '@aspectjs/common';
import type { Header as NHeader } from '@nestjs/common';
import { NESTJS_COMMON_ANNOTATION_FACTORY } from '../annotation-factory.global';
import { ReplaceReturnType } from '../type.utils';

export const Header = NESTJS_COMMON_ANNOTATION_FACTORY.create(
  AnnotationKind.METHOD,
  'Header',
  function () {} as ReplaceReturnType<typeof NHeader, void>,
);
