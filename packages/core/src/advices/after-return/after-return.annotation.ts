import { AnnotationKind } from '@aspectjs/common';
import type { PointcutExpression } from '../../pointcut/pointcut-expression.type';
import { _CORE_ANNOTATION_FACTORY } from '../../utils';
/* eslint-disable @typescript-eslint/no-unused-vars */

export const AfterReturn = _CORE_ANNOTATION_FACTORY.create(
  AnnotationKind.METHOD,
  'AfterReturn',
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  function (...pointcutExps: PointcutExpression[]) {},
);
