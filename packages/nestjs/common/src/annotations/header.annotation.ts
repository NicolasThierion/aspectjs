import { AnnotationType } from '@aspectjs/common';
import { Header as NHeader } from '@nestjs/common';
import { NESTJS_COMMON_ANNOTATION_FACTORY } from '../annotation-factory.global';
import { ReplaceReturnType } from '../type.utils';

export const Header = NESTJS_COMMON_ANNOTATION_FACTORY.create(
  AnnotationType.METHOD,
  function Header() {} as ReplaceReturnType<typeof NHeader, void>,
);
