import { AnnotationType } from '@aspectjs/common';
import type { PointcutExpression } from '../../pointcut/pointcut-expression.type';
import { _CORE_ANNOTATION_FACTORY } from '../../utils';
/* eslint-disable @typescript-eslint/no-unused-vars */

export const Compile = _CORE_ANNOTATION_FACTORY.create(
  AnnotationType.METHOD,
  function Compile(pointcutExp: PointcutExpression) {},
);
