import { AnnotationFactory } from '@aspectjs/common';
import { ConstructorType } from '@aspectjs/common/utils';

export const TypeHint = new AnnotationFactory('aspectjs.utils').create(
  // @ts-ignore
  // eslint-disable @typescript-eslint/no-unused-vars
  function TypeHint(type: ConstructorType<any> | string) {},
);
