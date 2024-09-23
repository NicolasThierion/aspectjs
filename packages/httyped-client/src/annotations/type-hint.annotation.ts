/* eslint-disable @typescript-eslint/no-unused-vars */
import { AnnotationFactory } from '@aspectjs/common';
import { TypeHintType } from './../types/type-hint.type';
export const TypeHint = new AnnotationFactory('aspectjs.utils').create(
  'TypeHint',
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  function (type: TypeHintType | TypeHintType[]) {},
);
