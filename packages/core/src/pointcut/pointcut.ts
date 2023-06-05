import type { AnnotationRef } from '@aspectjs/common';
import { assert } from '@aspectjs/common/utils';
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

  isAssignableFrom(pointcut: Pointcut): boolean {
    return (
      pointcut.targetType === this.targetType && this.type === pointcut.type
    );
  }

  merge(pointcut: Pointcut): void {
    assert(this.isAssignableFrom(pointcut));

    if (!this.annotations.length) {
      // pointcut already target all annotations
      return;
    } else if (!pointcut.annotations.length) {
      this.annotations.splice(0, this.annotations.length);
      return;
    }
    // merge annotations
    const annotations = [
      ...new Set([...this.annotations, ...pointcut.annotations]),
    ];

    this.annotations.push(...annotations.slice(annotations.length - 1));
  }
}
