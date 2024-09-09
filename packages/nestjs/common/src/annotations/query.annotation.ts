import { AnnotationType } from '@aspectjs/common';
import { Query as NQuery, PipeTransform, Type } from '@nestjs/common';
import { NESTJS_COMMON_ANNOTATION_FACTORY } from '../annotation-factory.global';
import { ReplaceReturnType } from '../type.utils';

export const Query = NESTJS_COMMON_ANNOTATION_FACTORY.create<
  AnnotationType.PARAMETER,
  | (() => void)
  | ((...pipes: (Type<PipeTransform> | PipeTransform)[]) => void)
  | ((
      property: string,
      ...pipes: (Type<PipeTransform> | PipeTransform)[]
    ) => void)
>(function Query() {} as ReplaceReturnType<typeof NQuery, void> as any);
