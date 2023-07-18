import type { AfterContext } from '../advices/after/after.context';
import type { JoinpointType } from './../pointcut/pointcut-target.type';

import type { AfterReturnContext } from '../advices/after-return/after-return.context';
import type { AfterThrowContext } from '../advices/after-throw/after-throw.context';
import type { AroundContext } from '../advices/around/around.context';
import type { CompileContext } from '../advices/compile/compile.context';
import type { BeforeContext } from './../advices/before/before.context';
export type AdviceContext<
  T extends JoinpointType = JoinpointType,
  X = unknown,
> =
  | AfterContext<T, X>
  | BeforeContext<T, X>
  | AfterReturnContext<T, X>
  | AfterThrowContext<T, X>
  | AroundContext<T, X>
  | CompileContext<T, X>;
