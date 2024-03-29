import { PointcutType } from '../../pointcut/pointcut-target.type';
import { JitWeaverCanvasStrategy } from './jit-canvas.strategy';

import {
  MethodPropertyDescriptor,
  assert,
  defineMetadata,
  getMetadata,
} from '@aspectjs/common/utils';
import { AdviceType } from '../../advice/advice-type.type';
import { JoinPoint } from '../../advice/joinpoint';
import { MutableAdviceContext } from '../../advice/mutable-advice.context';
import { AdviceEntry } from '../../advice/registry/advice-entry.model';
import { AdvicesSelection } from '../../advice/registry/advices-selection.model';
import { AdviceError } from '../../errors/advice.error';
import { CompiledSymbol } from '../../weaver/canvas/canvas-strategy.type';
import type { WeaverContext } from '../../weaver/context/weaver.context';
import { renameFunction } from './canvas.utils';

/**
 * Canvas to advise method and parameters
 */
export abstract class AbstractJitMethodCanvasStrategy<
  T extends PointcutType.METHOD | PointcutType.PARAMETER,
  X = unknown,
> extends JitWeaverCanvasStrategy<T, X> {
  protected abstract getAdviceEntries<P extends AdviceType>(
    selection: AdvicesSelection,
    pointcutType: P,
  ): AdviceEntry<T, X, P>[];

  compile(
    ctxt: MutableAdviceContext<T, X>,
    selection: AdvicesSelection,
  ): CompiledSymbol<T, X> {
    // if method already compiled, it might also be linked.
    // Use the last known compiled symbol as a reference to avoid linking twice.
    let methodDescriptor = getMetadata(
      '@ajs:compiledSymbol',
      ctxt.target.ref,
      () => ctxt.target.descriptor as CompiledSymbol<T, X>,
      true,
    );
    assert(!!methodDescriptor);

    //  if no method compile advices, return method is
    const adviceEntries = this.getAdviceEntries(selection, AdviceType.COMPILE);
    if (!adviceEntries.length) {
      return methodDescriptor;
    }

    assert(!!ctxt.target.propertyKey);
    if (!adviceEntries.length) {
      return Reflect.getOwnPropertyDescriptor(
        ctxt.target.proto,
        ctxt.target.propertyKey,
      ) as CompiledSymbol<T, X>;
    }

    adviceEntries
      //  prevent calling them twice.
      .filter((e) => !getMetadata('compiled', e, () => false))
      .forEach((entry) => {
        assert(typeof entry.advice === 'function');
        Object.defineProperty(
          ctxt.target.proto,
          ctxt.target.propertyKey,
          methodDescriptor,
        );

        methodDescriptor = (entry.advice.call(
          entry.aspect,
          ctxt.asCompileContext(),
        ) ?? methodDescriptor) as CompiledSymbol<T, X>;

        if (typeof methodDescriptor === 'function') {
          const surrogate = {
            fn: methodDescriptor,
          };
          methodDescriptor = Object.getOwnPropertyDescriptor(
            surrogate,
            'fn',
          )! as CompiledSymbol<T, X>;
        }

        if (typeof methodDescriptor.value !== 'function') {
          throw new AdviceError(
            entry.aspect,
            entry.advice,
            ctxt.target,
            'should return void, a function, or a Method property descriptor',
          );
        }

        defineMetadata('compiled', true, entry);
      });
    defineMetadata('@ajs:compiledSymbol', methodDescriptor, ctxt.target.ref);
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
    compiledSymbol = wrapMethodDescriptor(ctxt, compiledSymbol, joinpoint);

    return compiledSymbol as CompiledSymbol<T, X>;
  }
}

export class JitMethodCanvasStrategy<
  X = unknown,
> extends AbstractJitMethodCanvasStrategy<
  PointcutType.METHOD | PointcutType.PARAMETER,
  X
> {
  constructor(weaverContext: WeaverContext) {
    super(weaverContext, [PointcutType.METHOD, PointcutType.PARAMETER]);
  }

  protected override getAdviceEntries<P extends AdviceType>(
    selection: AdvicesSelection,
    pointcutType: P,
  ): AdviceEntry<PointcutType.METHOD | PointcutType.PARAMETER, X, P>[] {
    return [
      ...selection.find(
        [PointcutType.METHOD, PointcutType.PARAMETER],
        [pointcutType],
      ),
    ];
  }

  override compile(
    ctxt: MutableAdviceContext<PointcutType.METHOD | PointcutType.PARAMETER, X>,
    selection: AdvicesSelection,
  ): MethodPropertyDescriptor {
    return super.compile(ctxt, selection) as MethodPropertyDescriptor;
  }

  override link(
    ctxt: MutableAdviceContext<PointcutType.METHOD | PointcutType.PARAMETER, X>,
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
  ctxt: MutableAdviceContext<PointcutType.METHOD | PointcutType.PARAMETER, X>,
  descriptor: MethodPropertyDescriptor,
  joinpoint: JoinPoint,
): CompiledSymbol<PointcutType.METHOD | PointcutType.PARAMETER, X> {
  return {
    ...descriptor,
    value: renameFunction(
      joinpoint,
      ctxt.target.descriptor.value,
      `function ${String(ctxt.target.propertyKey)}$$advised`,
    ),
  };
}
