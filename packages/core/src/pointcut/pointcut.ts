import type { AnnotationRef } from '@aspectjs/common';
import { assert } from '@aspectjs/common/utils';
import { AdviceKind } from '../advice/advice-type.type';
import type { PointcutExpression } from './pointcut-expression.type';
import type { PointcutKind } from './pointcut-kind.type';

interface PointcutInit<
  P extends AdviceKind,
  T extends PointcutKind = PointcutKind,
> {
  readonly kind: P;
  readonly expression: PointcutExpression<T>;
}

export class Pointcut<
  P extends AdviceKind = AdviceKind,
  T extends PointcutKind = PointcutKind,
> {
  readonly kind: T;
  readonly annotations: AnnotationRef[];
  readonly name: string;
  readonly adviceKind: AdviceKind;
  private readonly _expr: PointcutExpression;

  constructor(pointcutInit: PointcutInit<P, T>) {
    this._expr = pointcutInit.expression;
    this.adviceKind = pointcutInit.kind;
    this.kind = this._expr.kind as T;
    this.annotations = this._expr.annotations;
    this.name = this._expr.name;
  }

  [Symbol.toPrimitive] = () => this.toString();

  toString(): string {
    return `${this.adviceKind}(${this._expr})`;
  }

  isAssignableFrom(pointcut: Pointcut): boolean {
    return (
      pointcut.kind === this.kind && this.adviceKind === pointcut.adviceKind
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
