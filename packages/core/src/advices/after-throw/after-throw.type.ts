import { AdviceKind } from '../../advice/advice-type.type';
import type { AdviceContext } from '../../advice/advice.context';
import { Pointcut } from '../../pointcut/pointcut';
import type { PointcutKind } from '../../pointcut/pointcut-kind.type';

export type AfterThrowPointcut<T extends PointcutKind = PointcutKind> =
  Pointcut<AdviceKind.AFTER_THROW, T>;

export type AfterThrowAdvice<
  T extends PointcutKind = PointcutKind,
  X = unknown,
> = {
  name: string;
  pointcuts: AfterThrowPointcut<T>[];
} & ((ctxt: AdviceContext<T, X>, thrownError: Error) => T | null | undefined);
