import {
  AnnotationRegistry,
  AnnotationTarget,
  AnnotationType,
  MethodPropertyDescriptor,
  TargetType,
} from '@aspectjs/common';
import { ConstructorType } from '@aspectjs/common/utils';

import { MutableAdviceContext } from '../advice/mutable-advice.context';
import { AdviceRegistry } from '../advice/registry/advice.registry';
import { AspectRegistry } from '../aspect/aspect.registry';
import { AspectType } from '../aspect/aspect.type';
import { JitWeaverCanvas } from './canvas/jit-canvas.type';
import { JitClassCanvasStrategy } from './canvas/jit-class-canvas.strategy';

import type { PointcutTargetType } from '../pointcut/pointcut-target.type';
import type { WeaverContext } from './../weaver/context/weaver.context';

import type { Weaver } from '../weaver/weaver';
import { JitMethodCanvasStrategy } from './canvas/jit-method-canvas.strategy';
import { JitParameterCanvasStrategy } from './canvas/jit-parameter-canvas.strategy';
import { JitPropertyCanvasStrategy } from './canvas/jit-property-canvas.strategy';
export class JitWeaver implements Weaver {
  static readonly __providerName = 'Weaver';

  private readonly enhancers = {
    [AnnotationType.CLASS]: this.enhanceClass.bind(this),
    [AnnotationType.PROPERTY]: this.enhanceProperty.bind(this),
    [AnnotationType.METHOD]: this.enhanceMethod.bind(this),
    [AnnotationType.PARAMETER]: this.enhanceParameter.bind(this),
  };

  private readonly annotationRegistry =
    this.weaverContext.get(AnnotationRegistry);
  private readonly aspectRegistry = this.weaverContext.get(AspectRegistry);
  private readonly adviceRegistry = this.weaverContext.get(AdviceRegistry);

  constructor(private readonly weaverContext: WeaverContext) {}

  enable(...aspects: AspectType[]): this {
    aspects.forEach((aspect) => {
      this.aspectRegistry.register(aspect);
    });
    return this;
  }

  getAspects<T = AspectType>(
    aspect?: string | ConstructorType<T>,
  ): AspectType[] {
    return this.aspectRegistry.getAspects(aspect);
  }

  enhance<T extends TargetType, X = unknown>(
    target: AnnotationTarget<T>,
  ): void | (new (...args: any[]) => X) | PropertyDescriptor {
    const annotations = this.annotationRegistry.select().on({ target }).find({
      searchParents: true,
    });

    const ctxt = new MutableAdviceContext({
      target,
      annotations,
    });

    return this.enhancers[target.type](ctxt as any);
  }

  private enhanceClass<X>(
    ctxt: MutableAdviceContext<PointcutTargetType.CLASS, X>,
  ): (new (...args: any[]) => X) | void {
    if (!ctxt.annotations.length) {
      // no annotations... Bypass the weaver as a whole,
      // as there are no chances this class has to be enhanced.
      return ctxt.target.proto.constructor;
    }

    // find all class advices for enabled aspects
    const advicesSelection = this.adviceRegistry.select({
      annotations: ctxt.annotations.map((a) => a.ref),
    });

    return new JitWeaverCanvas<PointcutTargetType.CLASS, X>(
      new JitClassCanvasStrategy<X>(this.weaverContext),
    )
      .compile(ctxt, advicesSelection)
      .link();
  }

  private enhanceProperty<X>(
    ctxt: MutableAdviceContext<
      PointcutTargetType.GET_PROPERTY | PointcutTargetType.SET_PROPERTY,
      X
    >,
  ): PropertyDescriptor | void {
    if (!ctxt.annotations.length) {
      // no annotations... Bypass the weaver as a whole,
      // as there are no chances this prop has to be enhanced.
      return ctxt.target.descriptor;
    }

    // find all property getter | setter advices for enabled aspects
    const advicesSelection = this.adviceRegistry.select({
      annotations: ctxt.annotations.map((a) => a.ref),
    });

    return new JitWeaverCanvas<
      PointcutTargetType.GET_PROPERTY | PointcutTargetType.SET_PROPERTY,
      X
    >(new JitPropertyCanvasStrategy<X>(this.weaverContext))
      .compile(ctxt, advicesSelection)
      .link();
  }

  private enhanceMethod<X>(
    ctxt: MutableAdviceContext<PointcutTargetType.METHOD, X>,
  ): MethodPropertyDescriptor | void {
    // TODO: test when 2 advices & 2 annotations on the same method
    if (!ctxt.annotations.length) {
      // no annotations... Bypass the weaver as a whole,
      // as there are no chances this prop has to be enhanced.
      return ctxt.target.descriptor;
    }

    // find all method advices for enabled aspects
    const advicesSelection = this.adviceRegistry.select({
      annotations: ctxt.annotations.map((a) => a.ref),
    });

    return new JitWeaverCanvas<PointcutTargetType.METHOD, X>(
      new JitMethodCanvasStrategy<X>(this.weaverContext),
    )
      .compile(ctxt, advicesSelection)
      .link();
  }

  private enhanceParameter<X>(
    ctxt: MutableAdviceContext<PointcutTargetType.PARAMETER, X>,
  ): MethodPropertyDescriptor | void {
    if (!ctxt.annotations.length) {
      // no annotations... Bypass the weaver as a whole,
      // as there are no chances this prop has to be enhanced.
      return ctxt.target.descriptor;
    }

    // find all parameter advices for enabled aspects
    const advicesSelection = this.adviceRegistry.select({
      annotations: ctxt.annotations.map((a) => a.ref),
    });

    return new JitWeaverCanvas<PointcutTargetType.PARAMETER, X>(
      new JitParameterCanvasStrategy<X>(this.weaverContext),
    )
      .compile(ctxt, advicesSelection)
      .link();
  }
}
