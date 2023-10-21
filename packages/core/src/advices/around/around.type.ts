import { AdviceType } from '../../advice/advice-type.type';
import type { AdviceContext } from '../../advice/advice.context';
import type { JoinPoint } from '../../advice/joinpoint';
import { Pointcut } from '../../pointcut/pointcut';
import type { PointcutType } from '../../pointcut/pointcut-target.type';

export type AroundPointcut<T extends PointcutType = PointcutType> = Pointcut<
  AdviceType.AROUND,
  T
>;

export type AroundAdvice<T extends PointcutType = PointcutType, X = unknown> = {
  name: string;
  pointcuts: AroundPointcut<T>[];
} & ((ctxt: AdviceContext<T, X>, joinPoint: JoinPoint, args: any[]) => any);
