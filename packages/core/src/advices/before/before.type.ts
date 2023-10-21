import { AdviceType } from '../../advice/advice-type.type';
import type { AdviceContext } from '../../advice/advice.context';
import { Pointcut } from '../../pointcut/pointcut';
import type { PointcutType } from './../../pointcut/pointcut-target.type';

export type BeforePointcut<T extends PointcutType = PointcutType> = Pointcut<
  AdviceType.BEFORE,
  T
>;

export type BeforeAdvice<T extends PointcutType = PointcutType, X = unknown> = {
  name: string;
  pointcuts: BeforePointcut<T>[];
} & ((ctxt: AdviceContext<T, X>) => void);
