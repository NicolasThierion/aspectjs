import type { AfterReturnAdvice } from '../advices/after-return/after-return.type';
import type { AfterThrowAdvice } from '../advices/after-throw/after-throw.type';
import type { AfterAdvice } from '../advices/after/after.type';
import type { AroundAdvice } from '../advices/around/around.type';
import type { BeforeAdvice } from '../advices/before/before.type';
import type { CompileAdvice } from '../advices/compile/compile.type';
import type { PointcutKind } from '../pointcut/pointcut-kind.type';
import { AdviceKind } from './advice-type.type';

export type Advice<
  T extends PointcutKind = PointcutKind,
  X = unknown,
  V extends AdviceKind = any,
> = V extends AdviceKind.COMPILE
  ? CompileAdvice<T, X>
  : V extends AdviceKind.BEFORE
  ? BeforeAdvice<T, X>
  : V extends AdviceKind.AROUND
  ? AroundAdvice<T, X>
  : V extends AdviceKind.AFTER_RETURN
  ? AfterReturnAdvice<T, X>
  : V extends AdviceKind.AFTER_THROW
  ? AfterThrowAdvice<T, X>
  : V extends AdviceKind.AFTER
  ? AfterAdvice<T, X>
  : never;
