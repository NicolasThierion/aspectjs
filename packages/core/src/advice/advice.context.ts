import type { AfterContext } from '../advices/after/after.context';
import type { PointcutType } from './../pointcut/pointcut-target.type';

import type { AfterReturnContext } from '../advices/after-return/after-return.context';
import type { AfterThrowContext } from '../advices/after-throw/after-throw.context';
import type { AroundContext } from '../advices/around/around.context';
import type { CompileContext } from '../advices/compile/compile.context';
import type { BeforeContext } from './../advices/before/before.context';

/**
 * Holds details about execution context that are passed to an advice when it is called.
 */
export type AdviceContext<T extends PointcutType = PointcutType, X = unknown> =
  | AfterContext<T, X>
  | BeforeContext<T, X>
  | AfterReturnContext<T, X>
  | AfterThrowContext<T, X>
  | AroundContext<T, X>
  | CompileContext<T, X>;
