import { AnnotationContext, AnnotationType } from '@aspectjs/common';
import { Delete } from './delete.annotation';
import { Get } from './get.annotation';
import { Head } from './head.annotation';
import { Option } from './option.annotation';
import { Patch } from './patch.annotation';
import { Post } from './post.annotation';
import { Put } from './put.annotation';

export type FetchAnnotationContext = AnnotationContext<
  AnnotationType.METHOD,
  (typeof FETCH_ANNOTATIONS)[number]
>;
export const FETCH_ANNOTATIONS = [Get, Post, Put, Delete, Patch, Head, Option];
export type FetchAnnotationType =
  | typeof Get
  | typeof Post
  | typeof Put
  | typeof Delete
  | typeof Patch
  | typeof Head
  | typeof Option;
