import { AdviceType } from '../../advice/advice-type.type';
import { Pointcut } from '../../pointcut/pointcut';
import type { JoinpointType } from '../../pointcut/pointcut-target.type';
import { AfterReturnContext } from './after-return.context';

export type AfterReturnPointcut<T extends JoinpointType = JoinpointType> =
  Pointcut<AdviceType.AFTER_RETURN, T>;

export type AfterReturnAdvice<
  T extends JoinpointType = JoinpointType,
  X = unknown,
> = {
  name: string;
  pointcuts: AfterReturnPointcut<T>[];
} & ((
  ctxt: AfterReturnContext<T, X>,
  returnValue: any,
) => T | null | undefined);
