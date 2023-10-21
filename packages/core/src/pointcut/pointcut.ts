import type { AnnotationRef } from '@aspectjs/common';
import { assert } from '@aspectjs/common/utils';
import { AdviceType } from '../advice/advice-type.type';
import type { PointcutExpression } from './pointcut-expression.type';
import type { PointcutType } from './pointcut-target.type';

interface PointcutInit<
  P extends AdviceType,
  T extends PointcutType = PointcutType,
> {
  readonly type: P;
  readonly expression: PointcutExpression<T>;
}

export class Pointcut<
  P extends AdviceType = AdviceType,
  T extends PointcutType = PointcutType,
> {
  readonly type: T;
  readonly annotations: AnnotationRef[];
  readonly name: string;
  readonly adviceType: AdviceType;
  private readonly _expr: PointcutExpression;

  constructor(pointcutInit: PointcutInit<P, T>) {
    this._expr = pointcutInit.expression;
    this.adviceType = pointcutInit.type;
    this.type = this._expr.type as T;
    this.annotations = this._expr.annotations;
    this.name = this._expr.name;
  }

  [Symbol.toPrimitive] = () => `${this.adviceType}(${this._expr})`;

  isAssignableFrom(pointcut: Pointcut): boolean {
    return (
      pointcut.type === this.type && this.adviceType === pointcut.adviceType
    );
  }

  merge(pointcut: Pointcut): this {
    assert(this.isAssignableFrom(pointcut));

    if (!this.annotations.length) {
      // pointcut already targets all annotations
      return this;
    } else if (!pointcut.annotations.length) {
      // pointcut now targets all annotations
      this.annotations.splice(0, this.annotations.length);
      return this;
    }

    // merge annotations
    const annotations = [
      ...new Set([...this.annotations, ...pointcut.annotations]),
    ];

    this.annotations.push(...annotations.slice(annotations.length - 1));

    return this;
  }
}
