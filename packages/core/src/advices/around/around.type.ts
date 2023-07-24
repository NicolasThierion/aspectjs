import { AdviceType } from '../../advice/advice-type.type';
import type { AdviceContext } from '../../advice/advice.context';
import type { JoinPoint } from '../../advice/joinpoint';
import { Pointcut } from '../../pointcut/pointcut';
import type { JoinpointType } from '../../pointcut/pointcut-target.type';

export type AroundPointcut<T extends JoinpointType = JoinpointType> = Pointcut<
  AdviceType.AROUND,
  T
>;

export type AroundAdvice<
  T extends JoinpointType = JoinpointType,
  X = unknown,
> = {
  name: string;
  pointcuts: AroundPointcut<T>[];
} & ((ctxt: AdviceContext<T, X>, joinPoint: JoinPoint, args: any[]) => any);
