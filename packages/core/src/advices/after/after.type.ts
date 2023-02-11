import type { Pointcut } from 'packages/core/src/pointcut/pointcut';
import type { AdviceContext } from '../../advice/advice.context';
import type { PointcutType } from '../../pointcut/pointcut-phase.type';
import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';

export type AfterPointcut<T extends PointcutTargetType = PointcutTargetType> =
  Pointcut<PointcutType.AFTER, T>;

export type AfterAdvice<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> = {
  name: string;
  pointcut: AfterPointcut<T>;
} & ((ctxt: AdviceContext<T, X>) => void);
