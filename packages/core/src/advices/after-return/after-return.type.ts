import { AdviceType } from '../../advice/advice-type.type';
import { Pointcut } from '../../pointcut/pointcut';
import type { PointcutType } from '../../pointcut/pointcut-target.type';
import { AfterReturnContext } from './after-return.context';

export type AfterReturnPointcut<T extends PointcutType = PointcutType> =
  Pointcut<AdviceType.AFTER_RETURN, T>;

export type AfterReturnAdvice<
  T extends PointcutType = PointcutType,
  X = unknown,
> = {
  name: string;
  pointcuts: AfterReturnPointcut<T>[];
} & ((
  ctxt: AfterReturnContext<T, X>,
  returnValue: any,
) => T | null | undefined);
