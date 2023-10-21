import type { AfterReturnAdvice } from '../advices/after-return/after-return.type';
import type { AfterThrowAdvice } from '../advices/after-throw/after-throw.type';
import type { AfterAdvice } from '../advices/after/after.type';
import type { AroundAdvice } from '../advices/around/around.type';
import type { BeforeAdvice } from '../advices/before/before.type';
import type { CompileAdvice } from '../advices/compile/compile.type';
import type { PointcutType } from './../pointcut/pointcut-target.type';
import { AdviceType } from './advice-type.type';

export type Advice<
  T extends PointcutType = PointcutType,
  X = unknown,
  V extends AdviceType = any,
> = V extends AdviceType.COMPILE
  ? CompileAdvice<T, X>
  : V extends AdviceType.BEFORE
  ? BeforeAdvice<T, X>
  : V extends AdviceType.AROUND
  ? AroundAdvice<T, X>
  : V extends AdviceType.AFTER_RETURN
  ? AfterReturnAdvice<T, X>
  : V extends AdviceType.AFTER_THROW
  ? AfterThrowAdvice<T, X>
  : V extends AdviceType.AFTER
  ? AfterAdvice<T, X>
  : never;
