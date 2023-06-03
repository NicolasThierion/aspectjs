import type { AdviceContext } from '../../advice/advice.context';
import { Pointcut } from '../../pointcut/pointcut';
import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';
import type { PointcutType } from '../../pointcut/pointcut.type';

export type AfterThrowPointcut<
  T extends PointcutTargetType = PointcutTargetType,
> = Pointcut<PointcutType.AFTER_THROW, T>;

export type AfterThrowAdvice<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> = {
  name: string;
  pointcuts: Set<AfterThrowPointcut<T>>;
} & ((ctxt: AdviceContext<T, X>, thrownError: Error) => T | null | undefined);
