import type { AnnotationRef } from '@aspectjs/common';
import { assert } from '@aspectjs/common/utils';
import { AdviceType } from '../advice/advice.type';
import type { PointcutExpression } from './pointcut-expression.type';
import type { PointcutTargetType } from './pointcut-target.type';

interface PointcutInit<
  P extends AdviceType,
  T extends PointcutTargetType = PointcutTargetType,
> {
  readonly type: P;
  readonly expression: PointcutExpression<T>;
}

export class Pointcut<
  P extends AdviceType = AdviceType,
  T extends PointcutTargetType = PointcutTargetType,
> {
  readonly targetType: T;
  readonly annotations: AnnotationRef[];
  readonly name: string;
  readonly adviceType: AdviceType;
  private readonly _expr: PointcutExpression;

  constructor(pointcutInit: PointcutInit<P, T>) {
    this._expr = pointcutInit.expression;
    this.adviceType = pointcutInit.type;
    this.targetType = this._expr.type as T;
    this.annotations = this._expr.annotations;
    this.name = this._expr.name;
  }

  [Symbol.toPrimitive] = () => `${this.adviceType}(${this._expr})`;

  isAssignableFrom(pointcut: Pointcut): boolean {
    return (
      pointcut.targetType === this.targetType &&
      this.adviceType === pointcut.adviceType
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
