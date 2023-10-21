import { AdviceType } from '../../advice/advice-type.type';
import type { AdviceContext } from '../../advice/advice.context';
import { Pointcut } from '../../pointcut/pointcut';
import type { PointcutType } from '../../pointcut/pointcut-target.type';

export type AfterPointcut<T extends PointcutType = PointcutType> = Pointcut<
  AdviceType.AFTER,
  T
>;

export type AfterAdvice<T extends PointcutType = PointcutType, X = unknown> = {
  /**
   * The name of this advice
   */
  name: string;
  /**
   * The set of pointcuts this advice stops at
   */
  pointcuts: AfterPointcut<T>[];
} & /**
 * The advice context
 */
((ctxt: AdviceContext<T, X>) => void);
