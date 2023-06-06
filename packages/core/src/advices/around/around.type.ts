import type { AdviceContext } from '../../advice/advice.context';
import { AdviceType } from '../../advice/advice.type';
import type { JoinPoint } from '../../advice/joinpoint';
import { Pointcut } from '../../pointcut/pointcut';
import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';

export type AroundPointcut<T extends PointcutTargetType = PointcutTargetType> =
  Pointcut<AdviceType.AROUND, T>;

export type AroundAdvice<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> = {
  name: string;
  pointcuts: AroundPointcut<T>[];
} & ((ctxt: AdviceContext<T, X>, joinPoint: JoinPoint, args: any[]) => any);
