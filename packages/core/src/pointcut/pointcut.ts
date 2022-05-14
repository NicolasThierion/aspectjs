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

export interface CompilePointcut<
  T extends PointcutTargetType = PointcutTargetType,
> extends Pointcut<PointcutPhase.COMPILE, T> {}

export interface AroundPointcut<
  T extends PointcutTargetType = PointcutTargetType,
> extends Pointcut<PointcutPhase.AROUND, T> {}

export interface BeforePointcut<
  T extends PointcutTargetType = PointcutTargetType,
> extends Pointcut<PointcutPhase.BEFORE, T> {}

export interface AfterReturnPointcut<
  T extends PointcutTargetType = PointcutTargetType,
> extends Pointcut<PointcutPhase.AFTER_RETURN, T> {}

export interface AfterPointcut<
  T extends PointcutTargetType = PointcutTargetType,
> extends Pointcut<PointcutPhase.AFTER, T> {}

export interface AfterThrowPointcut<
  T extends PointcutTargetType = PointcutTargetType,
> extends Pointcut<PointcutPhase.AFTER_THROW, T> {}
