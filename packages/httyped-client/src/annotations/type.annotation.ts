import { AnnotationFactory } from '@aspectjs/common';
import { ConstructorType } from '@aspectjs/common/utils';

export const TypeHint = new AnnotationFactory('aspectjs.utils').create(
  function TypeHint(type: ConstructorType<any> | string) {},
);
