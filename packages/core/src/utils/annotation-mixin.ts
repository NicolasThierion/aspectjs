import { Annotation, AnnotationRef, AnnotationType } from '@aspectjs/common';
import { assert, getPrototype } from '@aspectjs/common/utils';
import { Compile } from '../advices/compile/compile.annotation';
import { CompileContext } from '../advices/compile/compile.context';
import { Aspect } from '../aspect/aspect.annotation';
import { on } from '../pointcut/pointcut-expression.factory';
import { AspectType } from '../public_api';

export class AnnotationMixin {
  private bridgeCounter = 0;
  private bridges: [Annotation | AnnotationRef, (...args: any) => any][] = [];

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
    decorator:
      | ((
          ..._args: any[]
        ) =>
          | ClassDecorator
          | MethodDecorator
          | PropertyDecorator
          | ParameterDecorator)
      | Annotation,
  ) {
    this.bridges.push([annotation, decorator]);
    return this;
  }

  createAspect(name: string | AspectType) {
    let aspect: AspectType;

    if (typeof name === 'string') {
      @Aspect(name)
      class AnnotationMixinAspect {}

      aspect = new AnnotationMixinAspect();
    } else {
      aspect = name;
    }
    const proto = getPrototype(aspect);

    this.bridges.forEach(([annotation, decorator]) => {
      const ref1 = AnnotationRef.of(annotation);
      const ref2 = isAnnotation(decorator)
        ? AnnotationRef.of(decorator as any)
        : `${decorator.name}_${this.bridgeCounter++}`;

      const bridgeAdviceName = `bridge_${ref1}_${ref2}`;

      Object.defineProperty(proto, bridgeAdviceName, {
        enumerable: false,
        configurable: true,
        value: function (ctxt: CompileContext) {
          const annotationCtxt = ctxt.annotations(annotation).find()[0]!;
          assert(
            !!annotationCtxt,
            `annotation ${annotation} should have been found on ${ctxt}`,
          );

          return (decorator(...annotationCtxt.args) as any)(
            ...ctxt.target.asDecoratorArgs(),
          );
        },
      });

      Object.defineProperty(proto[bridgeAdviceName], 'name', {
        value: bridgeAdviceName,
      });
      const bridgeAdviceProp = Object.getOwnPropertyDescriptor(
        proto,
        bridgeAdviceName,
      )!;
      assert(!!bridgeAdviceProp);
      Compile(on.any.withAnnotations(ref1))(
        proto,
        bridgeAdviceName,
        bridgeAdviceProp!,
      );
    });

    return aspect;
  }
}

function isAnnotation(decorator: Annotation | any): boolean {
  return (
    !!(decorator as Annotation).groupId && !!(decorator as Annotation).name
  );
}
