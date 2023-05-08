import { PointcutTargetType } from '../../pointcut/pointcut-target.type';
import { JitWeaverCanvasStrategy } from './jit-canvas.strategy';

import { assert, getMetadata } from '@aspectjs/common/utils';
import { MutableAdviceContext } from '../../advice/mutable-advice.context';
import { AdvicesSelection } from '../../advice/registry/advices-selection.model';
import { PointcutType } from '../../pointcut/pointcut.type';
import { JoinPoint } from '../../public_api';
import { MethodPropertyDescriptor } from '../../weaver/canvas/canvas-strategy.type';
import type { WeaverContext } from '../../weaver/context/weaver.context';
import { renameFunction } from './canvas.utils';
/**
 * Canvas to advise method getters and setters
 */
export class JitMethodCanvasStrategy<
  X = unknown,
> extends JitWeaverCanvasStrategy<PointcutTargetType.METHOD, X> {
  constructor(weaverContext: WeaverContext) {
    super(weaverContext, PointcutTargetType.METHOD);
  }

  compile(
    ctxt: MutableAdviceContext<PointcutTargetType.METHOD, X>,
    selection: AdvicesSelection,
  ): MethodPropertyDescriptor {
    //  if no method compile advices, return method is
    const adviceEntries = [
      ...selection.find(PointcutTargetType.METHOD, PointcutType.COMPILE),
    ];

    assert(!!ctxt.target.propertyKey);
    if (!adviceEntries.length) {
      return Reflect.getOwnPropertyDescriptor(
        ctxt.target.proto,
        ctxt.target.propertyKey,
      ) as MethodPropertyDescriptor;
    }

    let methodDescriptor = getMetadata(
      '@aspectjs:jitMethodCanvas',
      ctxt.target.proto,
      ctxt.target.propertyKey,
      () =>
        Reflect.getOwnPropertyDescriptor(
          ctxt.target.proto,
          ctxt.target.propertyKey,
        ) as MethodPropertyDescriptor,
      true,
    );

    adviceEntries.forEach((entry) => {
      assert(typeof entry === 'function');
      methodDescriptor = (entry.advice.call(
        entry.aspect,
        ctxt.asCompileContext(),
      ) ?? methodDescriptor) as MethodPropertyDescriptor;
    });
    return methodDescriptor;
  }

  override callJoinpoint(
    ctxt: MutableAdviceContext<PointcutTargetType.METHOD, X>,
    originalSymbol: MethodPropertyDescriptor,
  ): unknown {
    return (ctxt.value = originalSymbol.value.call(
      ctxt.instance,
      ...ctxt.args!,
    ));
  }

  link(
    ctxt: MutableAdviceContext<PointcutTargetType.METHOD, X>,
    compiledSymbol: MethodPropertyDescriptor,
    joinpoint: (...args: any[]) => unknown,
  ): MethodPropertyDescriptor {
    return wrapMethodDescriptor(ctxt, compiledSymbol, joinpoint);
  }
}

function wrapMethodDescriptor<X>(
  ctxt: MutableAdviceContext<PointcutTargetType.METHOD, X>,
  descriptor: MethodPropertyDescriptor,
  joinpoint: JoinPoint,
): MethodPropertyDescriptor {
  return {
    ...descriptor,
    value: renameFunction(
      joinpoint,
      ctxt.target.propertyKey,
      `function ${ctxt.target.propertyKey}$$advised`,
    ),
  };
}
