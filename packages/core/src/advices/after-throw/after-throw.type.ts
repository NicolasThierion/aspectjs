import { AdviceType } from '../../advice/advice-type.type';
import type { AdviceContext } from '../../advice/advice.context';
import { Pointcut } from '../../pointcut/pointcut';
import type { PointcutType } from '../../pointcut/pointcut-target.type';

export type AfterThrowPointcut<T extends PointcutType = PointcutType> =
  Pointcut<AdviceType.AFTER_THROW, T>;

export type AfterThrowAdvice<
  T extends PointcutType = PointcutType,
  X = unknown,
> = {
  name: string;
  pointcuts: AfterThrowPointcut<T>[];
} & ((ctxt: AdviceContext<T, X>, thrownError: Error) => T | null | undefined);
