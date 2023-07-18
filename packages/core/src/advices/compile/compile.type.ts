import type { AdviceContext } from '../../advice/advice.context';
import { AdviceType } from '../../advice/advice.type';
import type { Pointcut } from '../../pointcut/pointcut';
import type { JoinpointType } from '../../pointcut/pointcut-target.type';

export type CompilePointcut<T extends JoinpointType = JoinpointType> = Pointcut<
  AdviceType.COMPILE,
  T
>;

export type CompileAdvice<
  T extends JoinpointType = JoinpointType,
  X = unknown,
> = {
  name: string;
  pointcuts: CompilePointcut<T>[];
} & ((ctxt: AdviceContext<T, X>) => T extends JoinpointType.CLASS
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    undefined | Function
  : PropertyDescriptor);
