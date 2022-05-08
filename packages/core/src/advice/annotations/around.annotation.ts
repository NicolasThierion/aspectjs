import type { AnnotationType } from '@aspectjs/common';
import type { PointcutExpression } from '../../pointcut/pointcut-expression.type';
import { _CORE_ANNOTATION_FACTORY } from '../../utils';

export const Around = _CORE_ANNOTATION_FACTORY.create<AnnotationType.METHOD>(
  function Around(pointcutExp: PointcutExpression) {},
);
