import { AnnotationKind } from '@aspectjs/common';
import type { Body as NBody, PipeTransform, Type } from '@nestjs/common';
import { NESTJS_COMMON_ANNOTATION_FACTORY } from '../annotation-factory.global';
import { ReplaceReturnType } from '../type.utils';

export const Body = NESTJS_COMMON_ANNOTATION_FACTORY.create<
  AnnotationKind.PARAMETER,
  | (() => void)
  | ((...pipes: (Type<PipeTransform> | PipeTransform)[]) => void)
  | ((
      property: string,
      ...pipes: (Type<PipeTransform> | PipeTransform)[]
    ) => void)
>(AnnotationKind.PARAMETER, 'Body', function Body() {} as ReplaceReturnType<
  typeof NBody,
  void
>);
