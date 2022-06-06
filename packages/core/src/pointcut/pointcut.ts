import type { AnnotationRef } from '@aspectjs/common';
import type { PointcutExpression } from './pointcut-expression.type';
import type { AdviceType } from './pointcut-phase.type';
import type { PointcutTargetType } from './pointcut-target.type';

interface PointcutInit<
  P extends AdviceType,
  T extends PointcutTargetType = PointcutTargetType,
> {
  readonly adviceType: P;
  readonly expression: PointcutExpression<T>;
}

export class Pointcut<
  P extends AdviceType = AdviceType,
  T extends PointcutTargetType = PointcutTargetType,
> {
  readonly type: T;
  readonly annotations: AnnotationRef[];
  readonly name: string;
  readonly adviceType: AdviceType;
  private readonly _expr: PointcutExpression;

  constructor(pointcutInit: PointcutInit<P, T>) {
    this._expr = pointcutInit.expression;
    this.adviceType = pointcutInit.adviceType;
    this.type = this._expr.type as T;
    this.annotations = this._expr.annotations;
    this.name = this._expr.name;
  }

  [Symbol.toPrimitive] = () => `${this.adviceType}(${this._expr})`;
}

export type CompilePointcut<T extends PointcutTargetType = PointcutTargetType> =
  Pointcut<AdviceType.COMPILE, T>;

export type AroundPointcut<T extends PointcutTargetType = PointcutTargetType> =
  Pointcut<AdviceType.AROUND, T>;

export type BeforePointcut<T extends PointcutTargetType = PointcutTargetType> =
  Pointcut<AdviceType.BEFORE, T>;

export type AfterReturnPointcut<
  T extends PointcutTargetType = PointcutTargetType,
> = Pointcut<AdviceType.AFTER_RETURN, T>;

export type AfterPointcut<T extends PointcutTargetType = PointcutTargetType> =
  Pointcut<AdviceType.AFTER, T>;

export type AfterThrowPointcut<
  T extends PointcutTargetType = PointcutTargetType,
> = Pointcut<AdviceType.AFTER_THROW, T>;
