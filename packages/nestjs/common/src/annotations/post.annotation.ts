import { AnnotationKind } from '@aspectjs/common';
import type { Post as NPost } from '@nestjs/common';
import { NESTJS_COMMON_ANNOTATION_FACTORY } from '../annotation-factory.global';
import { ReplaceReturnType } from '../type.utils';

export const Post = NESTJS_COMMON_ANNOTATION_FACTORY.create(
  AnnotationKind.METHOD,
  'Post',
  function () {} as ReplaceReturnType<typeof NPost, void>,
);
