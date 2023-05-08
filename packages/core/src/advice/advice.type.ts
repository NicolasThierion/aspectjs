import type { AnnotationTarget } from '@aspectjs/common';
import type { AfterReturnAdvice } from '../advices/after-return/after-return.type';
import type { AfterThrowAdvice } from '../advices/after-throw/after-throw.type';
import type { AfterAdvice } from '../advices/after/after.type';
import type { AroundAdvice } from '../advices/around/around.type';
import type { BeforeAdvice } from '../advices/before/before.type';
import type { CompileAdvice } from '../advices/compile/compile.type';
import type { PointcutType } from '../pointcut/pointcut.type';
import type {
  PointcutTargetType,
  ToTargetType,
} from './../pointcut/pointcut-target.type';

export type AdviceTarget<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> = AnnotationTarget<ToTargetType<T>, X>;

export type AdviceType<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
  V extends PointcutType = any,
> = V extends PointcutType.COMPILE
  ? CompileAdvice<T, X>
  : V extends PointcutType.BEFORE
  ? BeforeAdvice<T, X>
  : V extends PointcutType.AROUND
  ? AroundAdvice<T, X>
  : V extends PointcutType.AFTER_RETURN
  ? AfterReturnAdvice<T, X>
  : V extends PointcutType.AFTER_THROW
  ? AfterThrowAdvice<T, X>
  : V extends PointcutType.AFTER
  ? AfterAdvice<T, X>
  : never;
