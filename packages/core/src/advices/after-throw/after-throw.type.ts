import type { AdviceContext } from '../../advice/advice.context';
import { AdviceType } from '../../advice/advice.type';
import { Pointcut } from '../../pointcut/pointcut';
import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';

export type AfterThrowPointcut<
  T extends PointcutTargetType = PointcutTargetType,
> = Pointcut<AdviceType.AFTER_THROW, T>;

export type AfterThrowAdvice<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> = {
  name: string;
  pointcuts: AfterThrowPointcut<T>[];
} & ((ctxt: AdviceContext<T, X>, thrownError: Error) => T | null | undefined);
