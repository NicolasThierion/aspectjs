import type { AdviceContext } from '../../advice/advice.context';
import { AdviceType } from '../../advice/advice.type';
import { Pointcut } from '../../pointcut/pointcut';
import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';

export type AfterReturnPointcut<
  T extends PointcutTargetType = PointcutTargetType,
> = Pointcut<AdviceType.AFTER_RETURN, T>;

export type AfterReturnAdvice<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> = {
  name: string;
  pointcuts: AfterReturnPointcut<T>[];
} & ((ctxt: AdviceContext<T, X>, returnValue: any) => T | null | undefined);
