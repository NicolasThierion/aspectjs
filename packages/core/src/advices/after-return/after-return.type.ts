import { AdviceKind } from '../../advice/advice-type.type';
import { Pointcut } from '../../pointcut/pointcut';
import type { PointcutKind } from '../../pointcut/pointcut-kind.type';
import { AfterReturnContext } from './after-return.context';

export type AfterReturnPointcut<T extends PointcutKind = PointcutKind> =
  Pointcut<AdviceKind.AFTER_RETURN, T>;

export type AfterReturnAdvice<
  T extends PointcutKind = PointcutKind,
  X = unknown,
> = {
  name: string;
  pointcuts: AfterReturnPointcut<T>[];
} & ((
  ctxt: AfterReturnContext<T, X>,
  returnValue: any,
) => T | null | undefined);
