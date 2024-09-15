import { AdviceKind } from '../../advice/advice-type.type';
import type { AdviceContext } from '../../advice/advice.context';
import { Pointcut } from '../../pointcut/pointcut';
import type { PointcutKind } from '../../pointcut/pointcut-kind.type';

export type BeforePointcut<T extends PointcutKind = PointcutKind> = Pointcut<
  AdviceKind.BEFORE,
  T
>;

export type BeforeAdvice<T extends PointcutKind = PointcutKind, X = unknown> = {
  name: string;
  pointcuts: BeforePointcut<T>[];
} & ((ctxt: AdviceContext<T, X>) => void);
