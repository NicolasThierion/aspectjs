import { Annotation, AnnotationType } from '@aspectjs/common';
import type {
  ControllerOptions,
  Controller as NController,
} from '@nestjs/common';
import { NESTJS_COMMON_ANNOTATION_FACTORY } from '../annotation-factory.global';
import { ReplaceReturnType } from '../type.utils';

export const Controller: Annotation<
  AnnotationType.CLASS,
  | (() => void)
  | ((prefix: string | string[]) => void)
  | ((options: ControllerOptions) => void)
> = NESTJS_COMMON_ANNOTATION_FACTORY.create(
  AnnotationType.CLASS,
  function Controller() {} as ReplaceReturnType<typeof NController, void>,
) as any;
