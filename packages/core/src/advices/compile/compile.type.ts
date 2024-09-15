import { AdviceKind } from '../../advice/advice-type.type';
import type { AdviceContext } from '../../advice/advice.context';
import type { Pointcut } from '../../pointcut/pointcut';
import type { PointcutKind } from '../../pointcut/pointcut-kind.type';

export type CompilePointcut<T extends PointcutKind = PointcutKind> = Pointcut<
  AdviceKind.COMPILE,
  T
>;

export type CompileAdvice<
  T extends PointcutKind = PointcutKind,
  X = unknown,
> = {
  name: string;
  pointcuts: CompilePointcut<T>[];
} & ((ctxt: AdviceContext<T, X>) => T extends PointcutKind.CLASS
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    undefined | Function
  : PropertyDescriptor);
