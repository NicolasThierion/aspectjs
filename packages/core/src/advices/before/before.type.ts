import type { AdviceContext } from '../../advice/advice.context';
import { AdviceType } from '../../advice/advice.type';
import { Pointcut } from '../../pointcut/pointcut';
import type { JoinpointType } from './../../pointcut/pointcut-target.type';

export type BeforePointcut<T extends JoinpointType = JoinpointType> = Pointcut<
  AdviceType.BEFORE,
  T
>;

export type BeforeAdvice<
  T extends JoinpointType = JoinpointType,
  X = unknown,
> = {
  name: string;
  pointcuts: BeforePointcut<T>[];
} & ((ctxt: AdviceContext<T, X>) => void);
