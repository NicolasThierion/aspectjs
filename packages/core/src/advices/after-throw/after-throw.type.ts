import { AdviceType } from '../../advice/advice-type.type';
import type { AdviceContext } from '../../advice/advice.context';
import { Pointcut } from '../../pointcut/pointcut';
import type { JoinpointType } from '../../pointcut/pointcut-target.type';

export type AfterThrowPointcut<T extends JoinpointType = JoinpointType> =
  Pointcut<AdviceType.AFTER_THROW, T>;

export type AfterThrowAdvice<
  T extends JoinpointType = JoinpointType,
  X = unknown,
> = {
  name: string;
  pointcuts: AfterThrowPointcut<T>[];
} & ((ctxt: AdviceContext<T, X>, thrownError: Error) => T | null | undefined);
