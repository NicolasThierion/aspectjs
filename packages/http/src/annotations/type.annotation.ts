import { AnnotationFactory } from '@aspectjs/common';
import { ConstructorType } from '@aspectjs/common/utils';

export const Type = new AnnotationFactory('aspectjs.utils').create(
  function Type(type: ConstructorType) {},
);
