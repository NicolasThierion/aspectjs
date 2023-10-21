import type { Annotation } from '@aspectjs/common';
import { PointcutExpression } from './pointcut-expression.type';
import { PointcutType } from './pointcut-target.type';

class PointcutExpressionFactory<T extends PointcutType> {
  constructor(private readonly type: T) {}

  withAnnotations(...annotations: Annotation[]): PointcutExpression<T> {
    return new PointcutExpression({
      type: this.type,
      annotations,
    });
  }

  // withAllAnnotations(..._annotations: Annotation[]): PointcutExpression<T> {
  //   // TODO: implement PointcutExpressionFactory.withAllAnnotations
  //   throw new Error('not implemented');
  // }
}

class PropertyPointcutFactory extends PointcutExpressionFactory<PointcutType.GET_PROPERTY> {
  readonly setter: PointcutExpressionFactory<PointcutType.SET_PROPERTY>;
  constructor() {
    super(PointcutType.GET_PROPERTY);
    this.setter = new PointcutExpressionFactory(PointcutType.SET_PROPERTY);
  }
}

export const on = {
  classes: new PointcutExpressionFactory(PointcutType.CLASS),
  methods: new PointcutExpressionFactory(PointcutType.METHOD),
  parameters: new PointcutExpressionFactory(PointcutType.PARAMETER),
  properties: new PropertyPointcutFactory(),
  any: new PointcutExpressionFactory(PointcutType.ANY),
};
