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

export class Pointcut<
  P extends PointcutType = PointcutType,
  T extends PointcutTargetType = PointcutTargetType,
> {
  readonly targetType: T;
  readonly annotations: AnnotationRef[];
  readonly name: string;
  readonly type: PointcutType;
  private readonly _expr: PointcutExpression;

  constructor(pointcutInit: PointcutInit<P, T>) {
    this._expr = pointcutInit.expression;
    this.type = pointcutInit.type;
    this.targetType = this._expr.type as T;
    this.annotations = this._expr.annotations;
    this.name = this._expr.name;
  }

  [Symbol.toPrimitive] = () => `${this.type}(${this._expr})`;
}
