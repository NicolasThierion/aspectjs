import type { AnnotationRef } from '@aspectjs/common';
import type { PointcutExpression } from './pointcut-expression.type';
import type { PointcutPhase } from './pointcut-phase.type';
import type { PointcutTargetType } from './pointcut-target.type';

interface PointcutInit<
  P extends PointcutPhase,
  T extends PointcutTargetType = PointcutTargetType,
> {
  readonly phase: P;
  readonly expression: PointcutExpression<T>;
}

export class Pointcut<
  P extends PointcutPhase = PointcutPhase,
  T extends PointcutTargetType = PointcutTargetType,
> {
  readonly type: T;
  readonly annotations: AnnotationRef[];
  readonly name: string;
  readonly phase: PointcutPhase;
  private readonly _expr: PointcutExpression;

  constructor(pointcutInit: PointcutInit<P, T>) {
    this._expr = pointcutInit.expression;
    this.phase = pointcutInit.phase;
    this.type = this._expr.type as T;
    this.annotations = this._expr.annotations;
    this.name = this._expr.name;
  }

  [Symbol.toPrimitive] = () => `${this.phase}(${this._expr})`;
}

export type CompilePointcut<T extends PointcutTargetType = PointcutTargetType> =
  Pointcut<PointcutPhase.COMPILE, T>;

export type AroundPointcut<T extends PointcutTargetType = PointcutTargetType> =
  Pointcut<PointcutPhase.AROUND, T>;

export type BeforePointcut<T extends PointcutTargetType = PointcutTargetType> =
  Pointcut<PointcutPhase.BEFORE, T>;

export type AfterReturnPointcut<
  T extends PointcutTargetType = PointcutTargetType,
> = Pointcut<PointcutPhase.AFTER_RETURN, T>;

export type AfterPointcut<T extends PointcutTargetType = PointcutTargetType> =
  Pointcut<PointcutPhase.AFTER, T>;

export type AfterThrowPointcut<
  T extends PointcutTargetType = PointcutTargetType,
> = Pointcut<PointcutPhase.AFTER_THROW, T>;
