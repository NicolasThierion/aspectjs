import {
  _AnnotationTargetImpl,
  Annotation,
  AnnotationRegistry,
  AnnotationTarget,
  AnnotationTargetFactory,
  AnnotationTargetRef,
  AnnotationType,
} from '@aspectjs/common';
import {
  assert,
  ConstructorType,
  MethodPropertyDescriptor,
} from '@aspectjs/common/utils';

import { MutableAdviceContext } from '../advice/mutable-advice.context';
import { AdviceRegistry } from '../advice/registry/advice.registry';
import { AspectRegistry } from '../aspect/aspect.registry';
import { AspectType } from '../aspect/aspect.type';
import { JitWeaverCanvas } from './canvas/jit-canvas.type';
import { JitClassCanvasStrategy } from './canvas/jit-class-canvas.strategy';

import type { PointcutType } from '../pointcut/pointcut-target.type';
import type { WeaverContext } from './../weaver/context/weaver.context';

import type { Weaver } from '../weaver/weaver';
import { JitMethodCanvasStrategy } from './canvas/jit-method-canvas.strategy';
import { JitParameterCanvasStrategy } from './canvas/jit-parameter-canvas.strategy';
import { JitPropertyCanvasStrategy } from './canvas/jit-property-canvas.strategy';
import { createJitWeaverDecorator } from './jit-weaver-decorator.provider';
export class JitWeaver implements Weaver {
  static readonly __providerName = 'Weaver';

  private readonly enhancers = {
    [AnnotationType.CLASS]: this.enhanceClass.bind(this),
    [AnnotationType.PROPERTY]: this.enhanceProperty.bind(this),
    [AnnotationType.METHOD]: this.enhanceMethod.bind(this),
    [AnnotationType.PARAMETER]: this.enhanceParameter.bind(this),
  };

  private readonly annotationRegistry: AnnotationRegistry;
  private readonly aspectRegistry: AspectRegistry;
  private readonly adviceRegistry: AdviceRegistry;
  private readonly enhancedTargets = new WeakMap<
    AnnotationTargetRef,
    AnnotationTarget
  >();
  private lastAnnotationsCount = 0;

  constructor(private readonly weaverContext: WeaverContext) {
    this.annotationRegistry = this.weaverContext.get(AnnotationRegistry);
    this.aspectRegistry = this.weaverContext.get(AspectRegistry);
    this.adviceRegistry = this.weaverContext.get(AdviceRegistry);
  }

  enable(...aspects: AspectType[]): this {
    aspects.forEach((aspect) => {
      this.aspectRegistry.register(aspect);
    });

    // try to enhance targets that already have been declared

    this.enhanceEarlyAnnotationDeclarations();

    return this;
  }

  getAspects<T = unknown>(
    aspect?: string | ConstructorType<T>,
  ): (T & AspectType)[] {
    return this.aspectRegistry.getAspects(aspect);
  }

  enhance<T extends AnnotationType, X = unknown>(
    target: _AnnotationTargetImpl<T, X> & AnnotationTarget<T, X>,
  ): void | ConstructorType<X> | PropertyDescriptor {
    this.enhancedTargets.set(target.ref, target);
    const annotations = (...annotations: Annotation[]) => {
      return this.annotationRegistry.select(...annotations).on({
        target,
        // types: [target.type]
      });
    };

    const ctxt = new MutableAdviceContext({
      target,
      annotations,
    });

    return this.enhancers[target.type](ctxt as any);
  }

  private enhanceClass<X>(
    ctxt: MutableAdviceContext<PointcutType.CLASS, X>,
  ): ConstructorType<X> | void {
    const { target } = ctxt;
    const annotationsForType = this.annotationRegistry
      .select()
      .on({
        target,
        types: [target.type],
      })
      .find();

    if (!annotationsForType.length) {
      // no annotations... Bypass the weaver as a whole,
      // as there are no chances this class has to be enhanced.
      return ctxt.target.proto.constructor;
    }

    // find all class advices for enabled aspects
    const advicesSelection = this.adviceRegistry.select({
      annotations: annotationsForType.map((a) => a.ref),
    });

    return new JitWeaverCanvas<PointcutType.CLASS, X>(
      new JitClassCanvasStrategy<X>(this.weaverContext),
    )
      .compile(ctxt, advicesSelection)
      .link();
  }

  private enhanceProperty<X>(
    ctxt: MutableAdviceContext<
      PointcutType.GET_PROPERTY | PointcutType.SET_PROPERTY,
      X
    >,
  ): PropertyDescriptor | void {
    const { target } = ctxt;
    const annotationsForType = this.annotationRegistry
      .select()
      .on({
        target,
        types: [target.type],
      })
      .find();

    if (!annotationsForType.length) {
      // no annotations... Bypass the weaver as a whole,
      // as there are no chances this prop has to be enhanced.
      return ctxt.target.descriptor;
    }

    // find all property getter | setter advices for enabled aspects
    const advicesSelection = this.adviceRegistry.select({
      annotations: annotationsForType.map((a) => a.ref),
    });

    return new JitWeaverCanvas<
      PointcutType.GET_PROPERTY | PointcutType.SET_PROPERTY,
      X
    >(new JitPropertyCanvasStrategy<X>(this.weaverContext))
      .compile(ctxt, advicesSelection)
      .link();
  }

  private enhanceMethod<X>(
    ctxt: MutableAdviceContext<PointcutType.METHOD, X>,
  ): MethodPropertyDescriptor | void {
    const { target } = ctxt;
    const annotationsForType = this.annotationRegistry
      .select()
      .on({
        target,
        types: [AnnotationType.METHOD, AnnotationType.PARAMETER],
      })
      .find();
    if (!annotationsForType.length) {
      // no annotations... Bypass the weaver as a whole,
      // as there are no chances this prop has to be enhanced.
      return ctxt.target.descriptor;
    }

    // find all method advices for enabled aspects
    const advicesSelection = this.adviceRegistry.select({
      annotations: annotationsForType.map((a) => a.ref),
    });

    return new JitWeaverCanvas<PointcutType.METHOD | PointcutType.PARAMETER, X>(
      new JitMethodCanvasStrategy<X>(this.weaverContext),
    )
      .compile(ctxt, advicesSelection)
      .link();
  }

  private enhanceParameter<X>(
    ctxt: MutableAdviceContext<PointcutType.PARAMETER, X>,
  ): MethodPropertyDescriptor | void {
    const { target } = ctxt;
    const annotationsForType = this.annotationRegistry
      .select()
      .on({
        target,
        types: [target.type],
      })
      .find();

    if (!annotationsForType.length) {
      // no annotations... Bypass the weaver as a whole,
      // as there are no chances this prop has to be enhanced.
      return ctxt.target.descriptor;
    }

    // find all parameter advices for enabled aspects
    const advicesSelection = this.adviceRegistry.select({
      annotations: annotationsForType.map((a) => a.ref),
    });

    return new JitWeaverCanvas<PointcutType.PARAMETER, X>(
      new JitParameterCanvasStrategy<X>(this.weaverContext),
    )
      .compile(ctxt, advicesSelection)
      .link();
  }

  private enhanceEarlyAnnotationDeclarations() {
    const allAnnotations = this.annotationRegistry.select().all().find();
    const lastAnnotationsCount = allAnnotations.length;
    if (lastAnnotationsCount !== this.lastAnnotationsCount) {
      // new annotation since last enhance ?
      this.lastAnnotationsCount = lastAnnotationsCount;
      allAnnotations
        .filter((a) => !this.enhancedTargets.has(a.target.ref))
        .forEach((a) => {
          const decorator = createJitWeaverDecorator(
            this,
            this.weaverContext.get(AnnotationTargetFactory),
          );

          const decoree = decorator.apply(null, a.target.asDecoratorArgs());
          if (decoree) {
            if (a.target.type === AnnotationType.CLASS) {
              assert(typeof decoree === 'function');
              a.target.proto['constructor'] = decoree as ConstructorType;
            } else {
              Object.defineProperty(
                a.target.proto,
                a.target.propertyKey,
                decoree,
              );
            }
          }
        });
    }
  }
}
