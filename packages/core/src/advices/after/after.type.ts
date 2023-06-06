import type { AdviceContext } from '../../advice/advice.context';
import { AdviceType } from '../../advice/advice.type';
import { Pointcut } from '../../pointcut/pointcut';
import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';

export type AfterPointcut<T extends PointcutTargetType = PointcutTargetType> =
  Pointcut<AdviceType.AFTER, T>;

export type AfterAdvice<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> = {
  name: string;
  pointcuts: AfterPointcut<T>[];
} & ((ctxt: AdviceContext<T, X>) => void);
