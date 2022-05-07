import type { PointcutExpression } from '../../pointcut/pointcut-expression.type';
import { _CORE_ANNOTATION_FACTORY } from '../../utils';

export const Compile = _CORE_ANNOTATION_FACTORY.create(function Compile(
  pointcutExp: PointcutExpression,
) {});
