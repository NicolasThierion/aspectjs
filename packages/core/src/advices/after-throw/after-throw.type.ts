import type { Pointcut } from 'packages/core/src/pointcut/pointcut';
import type { AdviceContext } from '../../advice/advice.context';
import type { PointcutType } from '../../pointcut/pointcut-phase.type';
import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';

export type AfterThrowPointcut<
  T extends PointcutTargetType = PointcutTargetType,
> = Pointcut<PointcutType.AFTER_THROW, T>;

export type AfterThrowAdvice<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> = {
  name: string;
  pointcut: AfterThrowPointcut<T>;
} & ((ctxt: AdviceContext<T, X>, thrownError: Error) => T | null | undefined);
