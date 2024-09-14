import { AdviceKind } from '../../advice/advice-type.type';
import type { AdviceContext } from '../../advice/advice.context';
import type { JoinPoint } from '../../advice/joinpoint';
import { Pointcut } from '../../pointcut/pointcut';
import type { PointcutKind } from '../../pointcut/pointcut-kind.type';

export type AroundPointcut<T extends PointcutKind = PointcutKind> = Pointcut<
  AdviceKind.AROUND,
  T
>;

export type AroundAdvice<T extends PointcutKind = PointcutKind, X = unknown> = {
  name: string;
  pointcuts: AroundPointcut<T>[];
} & ((ctxt: AdviceContext<T, X>, joinPoint: JoinPoint, args: any[]) => any);
