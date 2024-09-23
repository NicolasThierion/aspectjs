import { Annotation, AnnotationKind } from '@aspectjs/common';
import type {
  ControllerOptions,
  Controller as NController,
} from '@nestjs/common';
import { NESTJS_COMMON_ANNOTATION_FACTORY } from '../annotation-factory.global';
import { ReplaceReturnType } from '../type.utils';

export const Controller: Annotation<
  AnnotationKind.CLASS,
  | (() => void)
  | ((prefix: string | string[]) => void)
  | ((options: ControllerOptions) => void)
> = NESTJS_COMMON_ANNOTATION_FACTORY.create(
  'Controller',
  function () {} as ReplaceReturnType<typeof NController, void>,
) as any;
