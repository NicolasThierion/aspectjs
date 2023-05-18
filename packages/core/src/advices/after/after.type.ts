import type { AdviceContext } from '../../advice/advice.context';
import { Pointcut } from '../../pointcut/pointcut';
import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';
import type { PointcutType } from '../../pointcut/pointcut.type';

export type AfterPointcut<T extends PointcutTargetType = PointcutTargetType> =
  Pointcut<PointcutType.AFTER, T>;

export type AfterAdvice<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> = {
  name: string;
  pointcut: AfterPointcut<T>;
} & ((ctxt: AdviceContext<T, X>) => void);
