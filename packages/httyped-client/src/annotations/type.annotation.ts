import { AnnotationFactory } from '@aspectjs/common';
import { TypeHintType } from './../types/type-hint.type';
export const TypeHint = new AnnotationFactory('aspectjs.utils').create(
  // @ts-ignore
  // eslint-disable @typescript-eslint/no-unused-vars
  function TypeHint(type: TypeHintType | TypeHintType[]) {},
);
