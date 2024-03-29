import { assert, getMetadata } from '@aspectjs/common/utils';

import { WeavingError } from '../../errors/weaving.error';

import type { PointcutType } from '../../pointcut/pointcut-target.type';

import { MutableAdviceContext } from '../../advice/mutable-advice.context';
import type { AdvicesSelection } from '../../advice/registry/advices-selection.model';
import type { CompiledSymbol } from '../../weaver/canvas/canvas-strategy.type';
import type { JitWeaverCanvasStrategy } from './jit-canvas.strategy';

export interface CompiledCanvas<
  T extends PointcutType = PointcutType,
  X = unknown,
> {
  compiledSymbol: CompiledSymbol<T, X> | undefined;
  link: () => CompiledSymbol<T, X> | undefined | void;
}
export class JitWeaverCanvas<
  T extends PointcutType = PointcutType,
  X = unknown,
> {
  constructor(private readonly strategy: JitWeaverCanvasStrategy<T, X>) {}

  compile<C extends MutableAdviceContext<T, X>>(
    ctxt: C,
    selection: AdvicesSelection,
  ): CompiledCanvas<T, X> {
    // if no advices, do not compile.
    // in fact, this condition makes it impossible to enable aspects lately, we enhance the target anyway
    // if (selection.find().next().done) {
    //   return {
    //     compiledSymbol: undefined,
    //     link: () => {},
    //   };
    // }

    const compiledSymbol = this.strategy.compile(ctxt, selection);
    if (!compiledSymbol) {
      assert(false);
    }

    assert(!!compiledSymbol);

    const bootstrapJp = (instance: any, ...args: any[]) => {
      ctxt.value = undefined;
      ctxt.args = args;
      if (!ctxt.target.static) {
        ctxt.instance = instance;
        ctxt.bind(instance);
      }
      if (getMetadata('@ajs:defuseAdvices', ctxt.target.ref)) {
        return this.strategy.callJoinpoint(ctxt, compiledSymbol);
      }

      // create the joinpoint for the original method
      ctxt.joinpoint = (...args: any[]) => {
        ctxt.args = args;

        try {
          this.strategy.before(ctxt, selection);

          this.strategy.callJoinpoint(ctxt, compiledSymbol);

          return this.strategy.afterReturn(ctxt, selection);
        } catch (error) {
          // consider WeavingErrors as not recoverable by an aspect
          if (error instanceof WeavingError) {
            throw error;
          }

          ctxt.error = error;
          return this.strategy.afterThrow(ctxt, selection);
        } finally {
          this.strategy.after(ctxt, selection);
        }
      };

      return this.strategy.around(ctxt, selection)(...args);
    };

    return {
      compiledSymbol,
      link: () => {
        return (
          this.strategy.link?.(ctxt, compiledSymbol, bootstrapJp) ??
          compiledSymbol
        );
      },
    };
  }
}
