import { AdviceKind } from '../../advice/advice-type.type';
import type { AdviceContext } from '../../advice/advice.context';
import { Pointcut } from '../../pointcut/pointcut';
import type { PointcutKind } from '../../pointcut/pointcut-kind.type';

export type AfterPointcut<T extends PointcutKind = PointcutKind> = Pointcut<
  AdviceKind.AFTER,
  T
>;

export type AfterAdvice<T extends PointcutKind = PointcutKind, X = unknown> = {
  /**
   * The name of this advice
   */
  name: string;
  /**
   * The set of pointcuts this advice stops at
   */
  pointcuts: AfterPointcut<T>[];
} & ((
  /**
   * The advice context
   */
  ctxt: AdviceContext<T, X>,
) => void);
