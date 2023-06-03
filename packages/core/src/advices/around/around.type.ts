import type { AdviceContext } from '../../advice/advice.context';
import type { JoinPoint } from '../../advice/joinpoint';
import { Pointcut } from '../../pointcut/pointcut';
import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';
import type { PointcutType } from '../../pointcut/pointcut.type';

export type AroundPointcut<T extends PointcutTargetType = PointcutTargetType> =
  Pointcut<PointcutType.AROUND, T>;

export type AroundAdvice<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> = {
  name: string;
  pointcuts: Set<AroundPointcut<T>>;
} & ((ctxt: AdviceContext<T, X>, joinPoint: JoinPoint, args: any[]) => any);
