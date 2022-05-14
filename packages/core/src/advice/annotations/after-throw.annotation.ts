import { AnnotationType } from '@aspectjs/common';
import type { PointcutExpression } from '../../pointcut/pointcut-expression.type';
import { _CORE_ANNOTATION_FACTORY } from '../../utils';

export const AfterThrow = _CORE_ANNOTATION_FACTORY.create(
  AnnotationType.METHOD,
  function AfterThrow(pointcutExp: PointcutExpression) {},
);
