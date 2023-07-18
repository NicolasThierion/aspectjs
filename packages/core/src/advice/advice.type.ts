import type { AnnotationTarget } from '@aspectjs/common';
import type { AfterReturnAdvice } from '../advices/after-return/after-return.type';
import type { AfterThrowAdvice } from '../advices/after-throw/after-throw.type';
import type { AfterAdvice } from '../advices/after/after.type';
import type { AroundAdvice } from '../advices/around/around.type';
import type { BeforeAdvice } from '../advices/before/before.type';
import type { CompileAdvice } from '../advices/compile/compile.type';
import type {
  JoinpointType,
  ToTargetType,
} from './../pointcut/pointcut-target.type';

export enum AdviceType {
  COMPILE = 'Compile',
  BEFORE = 'Before',
  AROUND = 'Around',
  AFTER_RETURN = 'AfterReturn',
  AFTER_THROW = 'AfterThrow',
  AFTER = 'After',
}

export type AdviceTarget<
  T extends JoinpointType = JoinpointType,
  X = unknown,
> = AnnotationTarget<ToTargetType<T>, X>;

export type Advice<
  T extends JoinpointType = JoinpointType,
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
