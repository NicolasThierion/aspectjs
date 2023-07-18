import type { Annotation } from '@aspectjs/common';
import { PointcutExpression } from './pointcut-expression.type';
import { JoinpointType } from './pointcut-target.type';

class PointcutExpressionFactory<T extends JoinpointType> {
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

class PropertyPointcutFactory extends PointcutExpressionFactory<JoinpointType.GET_PROPERTY> {
  readonly setter: PointcutExpressionFactory<JoinpointType.SET_PROPERTY>;
  constructor() {
    super(JoinpointType.GET_PROPERTY);
    this.setter = new PointcutExpressionFactory(JoinpointType.SET_PROPERTY);
  }
}

export const on = {
  classes: new PointcutExpressionFactory(JoinpointType.CLASS),
  methods: new PointcutExpressionFactory(JoinpointType.METHOD),
  parameters: new PointcutExpressionFactory(JoinpointType.PARAMETER),
  properties: new PropertyPointcutFactory(),
  any: new PointcutExpressionFactory(JoinpointType.ANY),
};
