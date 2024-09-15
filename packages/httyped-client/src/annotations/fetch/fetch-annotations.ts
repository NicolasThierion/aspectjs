import { AnnotationContext, AnnotationKind } from '@aspectjs/common';
import { Delete } from './delete.annotation';
import { Get } from './get.annotation';
import { Head } from './head.annotation';
import { Options } from './options.annotation';
import { Patch } from './patch.annotation';
import { Post } from './post.annotation';
import { Put } from './put.annotation';

export type FetchAnnotationContext = AnnotationContext<
  AnnotationKind.METHOD,
  (typeof FETCH_ANNOTATIONS)[number]
>;
export const FETCH_ANNOTATIONS = [Get, Post, Put, Delete, Patch, Head, Options];
export type FetchAnnotationKind =
  | typeof Get
  | typeof Post
  | typeof Put
  | typeof Delete
  | typeof Patch
  | typeof Head
  | typeof Options;
