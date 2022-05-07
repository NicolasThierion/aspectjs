import type { PointcutExpression } from '../../pointcut/pointcut-expression.type';
import { _CORE_ANNOTATION_FACTORY } from '../../utils';

export const After = _CORE_ANNOTATION_FACTORY.create(function After(
  pointcutExp: PointcutExpression,
) {});
