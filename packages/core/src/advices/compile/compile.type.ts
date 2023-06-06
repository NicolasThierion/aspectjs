import type { AdviceContext } from '../../advice/advice.context';
import { AdviceType } from '../../advice/advice.type';
import type { Pointcut } from '../../pointcut/pointcut';
import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';

export type CompilePointcut<T extends PointcutTargetType = PointcutTargetType> =
  Pointcut<AdviceType.COMPILE, T>;

export type CompileAdvice<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> = {
  name: string;
  pointcuts: CompilePointcut<T>[];
} & ((ctxt: AdviceContext<T, X>) => T extends PointcutTargetType.CLASS
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    undefined | Function
  : PropertyDescriptor);
