import type { AdviceContext } from '../../advice/advice.context';
import type { Pointcut } from '../../pointcut/pointcut';
import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';
import type { PointcutType } from '../../pointcut/pointcut.type';

export type CompilePointcut<T extends PointcutTargetType = PointcutTargetType> =
  Pointcut<PointcutType.COMPILE, T>;

export type CompileAdvice<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> = {
  name: string;
  pointcut: CompilePointcut<T>;
} & ((ctxt: AdviceContext<T, X>) => T extends PointcutTargetType.CLASS
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    undefined | Function
  : PropertyDescriptor);
