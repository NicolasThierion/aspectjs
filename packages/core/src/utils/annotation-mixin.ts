import { Annotation, AnnotationKind, AnnotationRef } from '@aspectjs/common';
import {
  assert,
  ConstructorType,
  getPrototype,
  MethodPropertyDescriptor,
} from '@aspectjs/common/utils';
import { Compile } from '../advices/compile/compile.annotation';
import { CompileContext } from '../advices/compile/compile.context';
import { Aspect } from '../aspect/aspect.annotation';
import { AspectType } from '../aspect/aspect.type';
import { on } from '../pointcut/pointcut-expression.factory';

export class AnnotationMixin {
  private bridgeCounter = 0;
  private bindings: [Annotation | AnnotationRef, (...args: any) => any][] = [];

  constructor() {}

  bind<
    A extends
      Annotation<AnnotationKind.CLASS> = Annotation<AnnotationKind.CLASS>,
  >(
    annotation: A | AnnotationRef,
    decorator: (...args: Parameters<A>) => ClassDecorator,
  ): this;
  bind<
    A extends
      Annotation<AnnotationKind.METHOD> = Annotation<AnnotationKind.METHOD>,
  >(
    annotation: A | AnnotationRef,
    decorator: (...args: Parameters<A>) => MethodDecorator,
  ): this;
  bind<
    A extends
      Annotation<AnnotationKind.PROPERTY> = Annotation<AnnotationKind.PROPERTY>,
  >(
    annotation: A | AnnotationRef,
    decorator: (...args: Parameters<A>) => PropertyDecorator,
  ): this;
  bind<
    A extends
      Annotation<AnnotationKind.PARAMETER> = Annotation<AnnotationKind.PARAMETER>,
  >(
    annotation: A | AnnotationRef,
    decorator: (...args: Parameters<A>) => ParameterDecorator,
  ): this;
  bind(
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
    this.bindings.push([annotation, decorator]);
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

    this.bindings.forEach(([annotation, decorator]) => {
      const ref1 = AnnotationRef.of(annotation);
      const ref2 = isAnnotation(decorator)
        ? AnnotationRef.of(decorator as any)
        : `${decorator.name}_${this.bridgeCounter++}`;

      const bindingAdviceName = `bridge_${ref1}_${ref2}`;

      Object.defineProperty(proto, bindingAdviceName, {
        enumerable: false,
        configurable: true,
        value: function (ctxt: CompileContext) {
          const annotationCtxt = ctxt.annotations(annotation).find()[0]!;
          assert(
            !!annotationCtxt,
            `annotation ${annotation} should have been found on ${ctxt}`,
          );

          // Mixed annotations should take unlinked descriptor as a reference.
          if (ctxt.target.kind === AnnotationKind.CLASS) {
            // restore constructor before linked, cause it will get linked again.
            const compiledCtor = ctxt.target.getMetadata<ConstructorType>(
              '@ajs:compiledSymbol',
            )!;
            assert(typeof compiledCtor === 'function');
            ctxt.target.proto.constructor = compiledCtor;
          } else {
            const compiledDescriptor = ctxt.target.getMetadata<
              PropertyDescriptor | MethodPropertyDescriptor
            >('@ajs:compiledSymbol')!;
            assert(typeof compiledDescriptor === 'object');

            Object.defineProperty(
              ctxt.target.proto,
              ctxt.target.propertyKey,
              compiledDescriptor,
            );
          }

          return (decorator(...annotationCtxt.args) as any)(
            ...ctxt.target.asDecoratorArgs(),
          );
        },
      });

      Object.defineProperty(proto[bindingAdviceName], 'name', {
        value: bindingAdviceName,
      });
      const bindingAdviceProp = Object.getOwnPropertyDescriptor(
        proto,
        bindingAdviceName,
      )!;
      assert(!!bindingAdviceProp);
      Compile(on.any.withAnnotations(ref1))(
        proto,
        bindingAdviceName,
        bindingAdviceProp!,
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
