import {
  AnnotationRegistry,
  AnnotationTarget,
  AnnotationType,
  TargetType,
} from '@aspectjs/common';
import { ConstructorType } from '@aspectjs/common/utils';

import { MutableAdviceContext } from '../advice/advice.context';
import { AdviceRegistry } from '../advice/registry/advice.registry';
import { AspectRegistry } from '../aspect/aspect.registry';
import { AspectType } from '../aspect/aspect.type';
import { JitWeaverCanvas } from './canvas/jit-canvas.type';
import { JitClassCanvas } from './canvas/jit-class-canvas.strategy';

import type { PointcutTargetType } from '../pointcut/pointcut-target.type';
import type { WeaverContext } from './../weaver/context/weaver.context';

import type { Weaver } from '../weaver/weaver';
import { JitPropertyGetCanvas } from './canvas/jit-property-get-canvas.strategy';
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
    const annotations = this.annotationRegistry.select().on({ target });

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
      annotations: ctxt.annotations.map((a) => a.annotation.ref),
    });

    return new JitWeaverCanvas<PointcutTargetType.CLASS, X>(
      new JitClassCanvas<X>(this.weaverContext),
    )
      .compile(ctxt, advicesSelection)
      .link();
  }

  private enhanceProperty<X>(
    ctxt: MutableAdviceContext<PointcutTargetType.GET_PROPERTY, X>,
  ): PropertyDescriptor | void {
    if (!ctxt.annotations.length) {
      // no annotations... Bypass the weaver as a whole,
      // as there are no chances this prop has to be enhanced.
      return ctxt.target.descriptor;
    }

    // find all property getter advices for enabled aspects
    const advicesSelection = this.adviceRegistry.select({
      annotations: ctxt.annotations.map((a) => a.annotation.ref),
    });

    return new JitWeaverCanvas<PointcutTargetType.GET_PROPERTY, X>(
      new JitPropertyGetCanvas<X>(this.weaverContext),
    )
      .compile(ctxt, advicesSelection)
      .link();
  }

  private enhanceMethod<T>(
    _ctxt: MutableAdviceContext<PointcutTargetType.METHOD, T>,
  ): PropertyDescriptor | void {
    return;
  }

  private enhanceParameter<T>(
    _ctxt: MutableAdviceContext<PointcutTargetType.METHOD, T>,
  ): PropertyDescriptor | void {
    return;
  }
}
