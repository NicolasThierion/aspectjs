import { PointcutTargetType } from '../../pointcut/pointcut-target.type';
import { PointcutType } from './../../pointcut/pointcut.type';
import { JitWeaverCanvasStrategy } from './jit-canvas.strategy';

import { MethodPropertyDescriptor } from '@aspectjs/common';
import { assert, getMetadata } from '@aspectjs/common/utils';
import { MutableAdviceContext } from '../../advice/mutable-advice.context';
import { AdviceEntry } from '../../advice/registry/advice-entry.model';
import { AdvicesSelection } from '../../advice/registry/advices-selection.model';
import { JoinPoint } from '../../public_api';
import { CompiledSymbol } from '../../weaver/canvas/canvas-strategy.type';
import type { WeaverContext } from '../../weaver/context/weaver.context';
import { renameFunction } from './canvas.utils';

/**
 * Canvas to advise method and parameters
 */
export abstract class AbstractJitMethodCanvasStrategy<
  T extends PointcutTargetType.METHOD | PointcutTargetType.PARAMETER,
  X = unknown,
> extends JitWeaverCanvasStrategy<T, X> {
  protected abstract getAdviceEntries<P extends PointcutType>(
    selection: AdvicesSelection,
    pointcutType: P,
  ): AdviceEntry<T, X, P>[];

  compile(
    ctxt: MutableAdviceContext<T, X>,
    selection: AdvicesSelection,
  ): CompiledSymbol<T, X> {
    //  if no method compile advices, return method is
    const adviceEntries = this.getAdviceEntries(
      selection,
      PointcutType.COMPILE,
    );

    assert(!!ctxt.target.propertyKey);
    if (!adviceEntries.length) {
      return Reflect.getOwnPropertyDescriptor(
        ctxt.target.proto,
        ctxt.target.propertyKey,
      ) as CompiledSymbol<T, X>;
    }

    let methodDescriptor = getMetadata(
      '@aspectjs:jitMethodCanvas',
      ctxt.target.proto,
      ctxt.target.propertyKey,
      () =>
        Reflect.getOwnPropertyDescriptor(
          ctxt.target.proto,
          ctxt.target.propertyKey,
        ) as CompiledSymbol<T, X>,
      true,
    );

    adviceEntries.forEach((entry) => {
      assert(typeof entry === 'function');
      methodDescriptor = (entry.advice.call(
        entry.aspect,
        ctxt.asCompileContext(),
      ) ?? methodDescriptor) as CompiledSymbol<T, X>;
    });
    return methodDescriptor;
  }

  override callJoinpoint(
    ctxt: MutableAdviceContext<T, X>,
    originalSymbol: MethodPropertyDescriptor,
  ): unknown {
    return (ctxt.value = originalSymbol.value.call(
      ctxt.instance,
      ...ctxt.args!,
    ));
  }

  link(
    ctxt: MutableAdviceContext<T, X>,
    compiledSymbol: MethodPropertyDescriptor,
    joinpoint: (...args: any[]) => unknown,
  ): CompiledSymbol<T, X> {
    return wrapMethodDescriptor(
      ctxt,
      compiledSymbol,
      joinpoint,
    ) as CompiledSymbol<T, X>;
  }
}

export class JitMethodCanvasStrategy<
  X = unknown,
> extends AbstractJitMethodCanvasStrategy<PointcutTargetType.METHOD, X> {
  constructor(weaverContext: WeaverContext) {
    super(weaverContext, PointcutTargetType.METHOD);
  }

  protected override getAdviceEntries<P extends PointcutType>(
    selection: AdvicesSelection,
    pointcutType: P,
  ): AdviceEntry<PointcutTargetType.METHOD, X, P>[] {
    return [...selection.find(PointcutTargetType.METHOD, pointcutType)];
  }

  override compile(
    ctxt: MutableAdviceContext<PointcutTargetType.METHOD, X>,
    selection: AdvicesSelection,
  ): MethodPropertyDescriptor {
    return super.compile(ctxt, selection) as MethodPropertyDescriptor;
  }

  override link(
    ctxt: MutableAdviceContext<PointcutTargetType.METHOD, X>,
    compiledSymbol: MethodPropertyDescriptor,
    joinpoint: (...args: any[]) => unknown,
  ): MethodPropertyDescriptor {
    return super.link(
      ctxt,
      compiledSymbol,
      joinpoint,
    ) as MethodPropertyDescriptor;
  }
}

function wrapMethodDescriptor<X>(
  ctxt: MutableAdviceContext<
    PointcutTargetType.METHOD | PointcutTargetType.PARAMETER,
    X
  >,
  descriptor: MethodPropertyDescriptor,
  joinpoint: JoinPoint,
): CompiledSymbol<PointcutTargetType.METHOD | PointcutTargetType.PARAMETER, X> {
  return {
    ...descriptor,
    value: renameFunction(
      joinpoint,
      (ctxt.target.proto as any)[ctxt.target.propertyKey]!,
      `function ${ctxt.target.propertyKey}$$advised`,
    ),
  };
}
