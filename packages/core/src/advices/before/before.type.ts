import type { AdviceContext } from '../../advice/advice.context';
import { Pointcut } from '../../pointcut/pointcut';
import type { PointcutType } from '../../pointcut/pointcut.type';
import type { PointcutTargetType } from './../../pointcut/pointcut-target.type';

export type BeforePointcut<T extends PointcutTargetType = PointcutTargetType> =
  Pointcut<PointcutType.BEFORE, T>;

export type BeforeAdvice<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> = {
  name: string;
  pointcuts: Set<BeforePointcut<T>>;
} & ((ctxt: AdviceContext<T, X>) => void);
