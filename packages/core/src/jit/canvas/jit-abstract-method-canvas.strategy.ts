import { PointcutKind } from '../../pointcut/pointcut-kind.type';
import { JitWeaverCanvasStrategy } from './jit-canvas.strategy';

import {
  MethodPropertyDescriptor,
  _copyPropsAndMeta,
  _defuseAbstract,
  assert,
  defineMetadata,
  getMetadata,
} from '@aspectjs/common/utils';
import { AdviceKind } from '../../advice/advice-type.type';
import { JoinPoint } from '../../advice/joinpoint';
import { MutableAdviceContext } from '../../advice/mutable-advice.context';
import { AdviceEntry } from '../../advice/registry/advice-entry.model';
import { AdviceError } from '../../errors/advice.error';
import { CompiledSymbol } from '../../weaver/canvas/canvas-strategy.type';
import { renameFunction } from './canvas.utils';

/**
 * Canvas to advise method and parameters
 */
export abstract class AbstractJitMethodCanvasStrategy<
  T extends PointcutKind.METHOD | PointcutKind.PARAMETER,
  X = unknown,
> extends JitWeaverCanvasStrategy<T, X> {
  protected abstract getAdviceEntries<P extends AdviceKind>(
    pointcutKind: P,
  ): AdviceEntry<T, X, P>[];

  compile(ctxt: MutableAdviceContext<T, X>): CompiledSymbol<T, X> {
    // if method already compiled, it might also be linked.
    // Use the last known compiled symbol as a reference to avoid linking twice.
    let methodDescriptor = ctxt.target.getMetadata(
      '@ajs:compiledSymbol',
      () => ctxt.target.descriptor as CompiledSymbol<T, X>,
    )!;

    assert(!!methodDescriptor);

    // an advice be a mixin compile advice, that in turn add new annotations & their new corresponding advices.
    // apply compile advices until state got stable
    let previousAdviceEntries: AdviceEntry<any, any, AdviceKind.COMPILE>[] = [];
    let adviceEntries = this.getAdviceEntries(AdviceKind.COMPILE);

    while (adviceEntries.length !== previousAdviceEntries.length) {
      previousAdviceEntries = adviceEntries;
      applyCompileAdvices();
      adviceEntries = this.getAdviceEntries(AdviceKind.COMPILE);
    }

    assert(!!ctxt.target.propertyKey);
    // if (!adviceEntries.length) {
    //   return Reflect.getOwnPropertyDescriptor(
    //     ctxt.target.proto,
    //     ctxt.target.propertyKey,
    //   ) as CompiledSymbol<T, X>;
    // }

    function applyCompileAdvices() {
      adviceEntries
        //  prevent calling them twice.
        .filter(
          (e) =>
            !getMetadata(
              `ajs.compiled`,
              e.advice,
              ctxt.target.ref.value,
              () => false,
            ),
        )
        .forEach((entry) => {
          try {
            defineMetadata(
              `ajs.compiled`,
              true,
              entry.advice,
              ctxt.target.ref.value,
            );

            assert(typeof entry.advice === 'function');
            Object.defineProperty(
              ctxt.target.proto,
              ctxt.target.propertyKey,
              methodDescriptor,
            );

            let newMethodDescriptor = entry.advice.call(
              entry.aspect,
              ctxt.asCompileContext(),
            ) as CompiledSymbol<T, X>;

            if (newMethodDescriptor) {
              if (typeof newMethodDescriptor === 'function') {
                const surrogate = {
                  fn: newMethodDescriptor,
                };
                newMethodDescriptor = Object.getOwnPropertyDescriptor(
                  surrogate,
                  'fn',
                )! as CompiledSymbol<T, X>;
              }
              if (typeof newMethodDescriptor.value !== 'function') {
                throw new AdviceError(
                  entry.aspect,
                  entry.advice,
                  ctxt.target,
                  'should return void, a function, or a Method property descriptor',
                );
              }

              _copyPropsAndMeta(
                newMethodDescriptor.value,
                methodDescriptor.value,
              ); // copy static props
              methodDescriptor = newMethodDescriptor;
            }
          } catch (e) {
            defineMetadata(
              `ajs.compiled`,
              false,
              entry.advice,
              ctxt.target.ref.value,
            );
            throw e;
          }
        });
      ctxt.target.defineMetadata('@ajs:compiledSymbol', methodDescriptor);
    }

    return methodDescriptor;
  }

  override callJoinpoint(
    ctxt: MutableAdviceContext<T, X>,
    originalSymbol: MethodPropertyDescriptor,
  ): unknown {
    return (ctxt.value = _defuseAbstract(() =>
      originalSymbol.value.call(ctxt.instance, ...ctxt.args!),
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

function wrapMethodDescriptor<X>(
  ctxt: MutableAdviceContext<PointcutKind.METHOD | PointcutKind.PARAMETER, X>,
  descriptor: MethodPropertyDescriptor,
  joinpoint: JoinPoint,
): CompiledSymbol<PointcutKind.METHOD | PointcutKind.PARAMETER, X> {
  return {
    ...descriptor,
    value: renameFunction(
      joinpoint,
      ctxt.target.descriptor.value,
      `function ${String(ctxt.target.propertyKey)}$$advised`,
    ),
  };
}
