import { assert } from '@aspectjs/common/utils';

import { WeavingError } from '../../errors/weaving.error';

import type { JoinpointType } from '../../pointcut/pointcut-target.type';

import { MutableAdviceContext } from '../../advice/mutable-advice.context';
import type { AdvicesSelection } from '../../advice/registry/advices-selection.model';
import type { CompiledSymbol } from '../../weaver/canvas/canvas-strategy.type';
import type { JitWeaverCanvasStrategy } from './jit-canvas.strategy';

export interface CompiledCanvas<
  T extends JoinpointType = JoinpointType,
  X = unknown,
> {
  compiledSymbol: CompiledSymbol<T, X> | undefined;
  link: () => CompiledSymbol<T, X> | undefined | void;
}
export class JitWeaverCanvas<
  T extends JoinpointType = JoinpointType,
  X = unknown,
> {
  constructor(private readonly strategy: JitWeaverCanvasStrategy<T, X>) {}

  compile<C extends MutableAdviceContext<T, X>>(
    ctxt: C,
    selection: AdvicesSelection,
  ): CompiledCanvas<T, X> {
    //  if no advices, do not compile.
    if (selection.find().next().done) {
      return {
        compiledSymbol: undefined,
        link: () => {},
      };
    }

    const compiledSymbol = this.strategy.compile(ctxt, selection);
    if (!compiledSymbol) {
      assert(false);
    }

    let withinAdviceSafeguard = false; // toggled to true before running joinpoint to avoid advice calling back itself
    assert(!!compiledSymbol);

    const bootstrapJp = (instance: any, ...args: any[]) => {
      ctxt.instance = instance;
      ctxt.args = args;
      if (withinAdviceSafeguard) {
        return this.strategy.callJoinpoint(ctxt, compiledSymbol);
      }

      // create the joinpoint for the original method
      const joinpoint = (...args: any[]) => {
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
      withinAdviceSafeguard = true;

      ctxt.value = undefined;
      ctxt.args = args;
      ctxt.instance = instance;
      ctxt.joinpoint = joinpoint;
      try {
        return this.strategy.around(ctxt, selection)(...args);
      } finally {
        withinAdviceSafeguard = false;
      }
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
