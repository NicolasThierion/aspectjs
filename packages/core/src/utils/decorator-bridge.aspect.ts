import { Annotation, AnnotationRef, AnnotationType } from '@aspectjs/common';
import { assert } from '@aspectjs/common/utils';
import { BeforeContext } from '../advices/before/before.context';
import { Compile } from '../advices/compile/compile.annotation';
import { Aspect } from '../aspect/aspect.annotation';
import { on } from '../pointcut/pointcut-expression.factory';

@Aspect() // no id, so multiple DecoratorBridgeAspect will not replace each other
export class DecoratorBridgeAspect {
  private bridgeCounter = 0;
  constructor() {}

  bridge<
    A extends
      Annotation<AnnotationType.CLASS> = Annotation<AnnotationType.CLASS>,
  >(
    annotation: A | AnnotationRef,
    decorator: (...args: Parameters<A>) => ClassDecorator,
  ): this;
  bridge<
    A extends
      Annotation<AnnotationType.METHOD> = Annotation<AnnotationType.METHOD>,
  >(
    annotation: A | AnnotationRef,
    decorator: (...args: Parameters<A>) => MethodDecorator,
  ): this;
  bridge<
    A extends
      Annotation<AnnotationType.PROPERTY> = Annotation<AnnotationType.PROPERTY>,
  >(
    annotation: A | AnnotationRef,
    decorator: (...args: Parameters<A>) => PropertyDecorator,
  ): this;
  bridge<
    A extends
      Annotation<AnnotationType.PARAMETER> = Annotation<AnnotationType.PARAMETER>,
  >(
    annotation: A | AnnotationRef,
    decorator: (...args: Parameters<A>) => ParameterDecorator,
  ): this;
  bridge(
    annotation: Annotation | AnnotationRef,
    decorator: (
      ..._args: any[]
    ) =>
      | ClassDecorator
      | MethodDecorator
      | PropertyDecorator
      | ParameterDecorator,
  ) {
    const ref = AnnotationRef.of(annotation);
    const proto = Object.getPrototypeOf(this);
    const bridgeAdviceName = `bridge_${ref.value}_${decorator.name}_${this
      .bridgeCounter++}`;

    proto[bridgeAdviceName] = function (ctxt: BeforeContext) {
      const annotationCtxt = ctxt.annotations(annotation).find()[0]!;
      assert(
        !!annotationCtxt,
        `annotation ${annotation} should have been found on ${ctxt}`,
      );
      return (decorator(...annotationCtxt.args) as any)(
        ...ctxt.target.asDecoratorArgs(),
      );
    };
    Object.defineProperty(proto[bridgeAdviceName], 'name', {
      value: bridgeAdviceName,
    });
    const bridgeAdviceProp = Object.getOwnPropertyDescriptor(
      proto,
      bridgeAdviceName,
    )!;
    assert(!!bridgeAdviceProp);
    Compile(on.any.withAnnotations(ref))(
      proto,
      bridgeAdviceName,
      bridgeAdviceProp!,
    );
    return this;
  }
}
