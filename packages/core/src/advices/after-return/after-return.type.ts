import type { AdviceContext } from '../../advice/advice.context';
import { AdviceType } from '../../advice/advice.type';
import { Pointcut } from '../../pointcut/pointcut';
import type { JoinpointType } from '../../pointcut/pointcut-target.type';

export type AfterReturnPointcut<T extends JoinpointType = JoinpointType> =
  Pointcut<AdviceType.AFTER_RETURN, T>;

export type AfterReturnAdvice<
  T extends JoinpointType = JoinpointType,
  X = unknown,
> = {
  name: string;
  pointcuts: AfterReturnPointcut<T>[];
} & ((ctxt: AdviceContext<T, X>, returnValue: any) => T | null | undefined);
