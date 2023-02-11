import type { Pointcut } from 'packages/core/src/pointcut/pointcut';
import type { AdviceContext } from '../../advice/advice.context';
import type { PointcutType } from '../../pointcut/pointcut-phase.type';
import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';

export type AfterReturnPointcut<
  T extends PointcutTargetType = PointcutTargetType,
> = Pointcut<PointcutType.AFTER_RETURN, T>;

export type AfterReturnAdvice<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> = {
  name: string;
  pointcut: AfterReturnPointcut<T>;
} & ((ctxt: AdviceContext<T, X>, returnValue: any) => T | null | undefined);
