import type { Annotation, AnnotationRef } from '@aspectjs/common';
import { PointcutExpression } from './pointcut-expression.type';
import { PointcutKind } from './pointcut-kind.type';

class PointcutExpressionFactory<T extends PointcutKind> {
  constructor(private readonly type: T) {}

  withAnnotations(
    ...annotations: (Annotation | AnnotationRef)[]
  ): PointcutExpression<T> {
    return new PointcutExpression({
      kind: this.type,
      annotations,
    });
  }

  // withAllAnnotations(..._annotations: Annotation[]): PointcutExpression<T> {
  //   // TODO: implement PointcutExpressionFactory.withAllAnnotations
  //   throw new Error('not implemented');
  // }
}

class PropertyPointcutFactory extends PointcutExpressionFactory<PointcutKind.GET_PROPERTY> {
  readonly setter: PointcutExpressionFactory<PointcutKind.SET_PROPERTY>;
  constructor() {
    super(PointcutKind.GET_PROPERTY);
    this.setter = new PointcutExpressionFactory(PointcutKind.SET_PROPERTY);
  }
}

export const on = {
  classes: new PointcutExpressionFactory(PointcutKind.CLASS),
  methods: new PointcutExpressionFactory(PointcutKind.METHOD),
  parameters: new PointcutExpressionFactory(PointcutKind.PARAMETER),
  properties: new PropertyPointcutFactory(),
  any: new PointcutExpressionFactory(PointcutKind.ANY),
};
