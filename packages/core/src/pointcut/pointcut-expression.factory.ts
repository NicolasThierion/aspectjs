import type { Annotation } from '@aspectjs/common';
import { PointcutExpression } from './pointcut-expression.type';
import { PointcutTargetType } from './pointcut-target.type';

class PointcutExpressionFactory<T extends PointcutTargetType> {
  constructor(private readonly targetType: T) {}

  withAnnotations(...annotations: Annotation[]): PointcutExpression<T> {
    return new PointcutExpression({
      type: this.targetType,
      annotations,
    });
  }

  // withAllAnnotations(..._annotations: Annotation[]): PointcutExpression<T> {
  //   // TODO: implement PointcutExpressionFactory.withAllAnnotations
  //   throw new Error('not implemented');
  // }
}

class PropertyPointcutFactory extends PointcutExpressionFactory<PointcutTargetType.GET_PROPERTY> {
  readonly setter: PointcutExpressionFactory<PointcutTargetType.SET_PROPERTY>;
  constructor() {
    super(PointcutTargetType.GET_PROPERTY);
    this.setter = new PointcutExpressionFactory(
      PointcutTargetType.SET_PROPERTY,
    );
  }
}

export const on = {
  classes: new PointcutExpressionFactory(PointcutTargetType.CLASS),
  methods: new PointcutExpressionFactory(PointcutTargetType.METHOD),
  parameters: new PointcutExpressionFactory(PointcutTargetType.PARAMETER),
  properties: new PropertyPointcutFactory(),
  any: new PointcutExpressionFactory(PointcutTargetType.ANY),
};
