import type { PointcutExpression } from '../../pointcut/pointcut-expression.type';
import { _CORE_ANNOTATION_FACTORY } from '../../utils';

export const AfterReturn = _CORE_ANNOTATION_FACTORY.create(function AfterReturn(
  pointcutExp: PointcutExpression,
) {});
