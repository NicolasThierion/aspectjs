import type { AdviceContext } from '../../advice/advice.context';
import { Pointcut } from '../../pointcut/pointcut';
import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';
import type { PointcutType } from '../../pointcut/pointcut.type';

export type AfterReturnPointcut<
  T extends PointcutTargetType = PointcutTargetType,
> = Pointcut<PointcutType.AFTER_RETURN, T>;

export type AfterReturnAdvice<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> = {
  name: string;
  pointcuts: Set<AfterReturnPointcut<T>>;
} & ((ctxt: AdviceContext<T, X>, returnValue: any) => T | null | undefined);
