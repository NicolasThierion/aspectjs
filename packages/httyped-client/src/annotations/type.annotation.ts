/* eslint-disable @typescript-eslint/no-unused-vars */
import { AnnotationFactory } from '@aspectjs/common';
import { TypeHintType } from './../types/type-hint.type';
export const TypeHint = new AnnotationFactory('aspectjs.utils').create(
  function TypeHint(type: TypeHintType | TypeHintType[]) {},
);
