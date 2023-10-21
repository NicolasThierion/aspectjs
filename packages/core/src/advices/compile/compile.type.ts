import { AdviceType } from '../../advice/advice-type.type';
import type { AdviceContext } from '../../advice/advice.context';
import type { Pointcut } from '../../pointcut/pointcut';
import type { PointcutType } from '../../pointcut/pointcut-target.type';

export type CompilePointcut<T extends PointcutType = PointcutType> = Pointcut<
  AdviceType.COMPILE,
  T
>;

export type CompileAdvice<
  T extends PointcutType = PointcutType,
  X = unknown,
> = {
  name: string;
  pointcuts: CompilePointcut<T>[];
} & ((ctxt: AdviceContext<T, X>) => T extends PointcutType.CLASS
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    undefined | Function
  : PropertyDescriptor);
