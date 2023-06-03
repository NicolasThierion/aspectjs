import type { AnnotationRef } from '@aspectjs/common';
import type { PointcutExpression } from './pointcut-expression.type';
import type { PointcutTargetType } from './pointcut-target.type';
import type { PointcutType } from './pointcut.type';

interface PointcutInit<
  P extends PointcutType,
  T extends PointcutTargetType = PointcutTargetType,
> {
  readonly type: P;
  readonly expression: PointcutExpression<T>;
}

const pointcutReg: Record<string, Pointcut> = {};

export class Pointcut<
  P extends PointcutType = PointcutType,
  T extends PointcutTargetType = PointcutTargetType,
> {
  readonly targetType: T;
  readonly annotations: AnnotationRef[];
  readonly name: string;
  readonly type: PointcutType;
  private readonly _expr: PointcutExpression;

  private constructor(pointcutInit: PointcutInit<P, T>) {
    this._expr = pointcutInit.expression;
    this.type = pointcutInit.type;
    this.targetType = this._expr.type as T;
    this.annotations = this._expr.annotations;
    this.name = this._expr.name;
  }

  static of<
    P extends PointcutType = PointcutType,
    T extends PointcutTargetType = PointcutTargetType,
  >(pointcutInit: PointcutInit<P, T>): Pointcut<P, T> {
    const p = new Pointcut<P, T>(pointcutInit);
    const k = `${p}`;
    pointcutReg[k] ??= p;
    return pointcutReg[k] as Pointcut<P, T>;
  }
  [Symbol.toPrimitive] = () => `${this.type}(${this._expr})`;
}
