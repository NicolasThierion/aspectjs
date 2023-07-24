import { AdviceType } from '../../advice/advice-type.type';
import type { AdviceContext } from '../../advice/advice.context';
import { Pointcut } from '../../pointcut/pointcut';
import type { JoinpointType } from '../../pointcut/pointcut-target.type';

export type AfterPointcut<T extends JoinpointType = JoinpointType> = Pointcut<
  AdviceType.AFTER,
  T
>;

export type AfterAdvice<
  T extends JoinpointType = JoinpointType,
  X = unknown,
> = {
  name: string;
  pointcuts: AfterPointcut<T>[];
} & ((ctxt: AdviceContext<T, X>) => void);
