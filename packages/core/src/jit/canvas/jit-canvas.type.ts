import { assert, isAbstractToken } from '@aspectjs/common/utils';

import { WeavingError } from '../../errors/weaving.error';

import type { PointcutType } from '../../pointcut/pointcut-target.type';

import { MutableAdviceContext } from '../../advice/mutable-advice.context';
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

  compile<C extends MutableAdviceContext<T, X>>(ctxt: C): CompiledCanvas<T, X> {
    // if no advices, do not compile.
    // in fact, this condition makes it impossible to enable aspects lately, we enhance the target anyway
    // if (selection.find().next().done) {
    //   return {
    //     compiledSymbol: undefined,
    //     link: () => {},
    //   };
    // }

    const compiledSymbol = this.strategy.compile(ctxt);
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
      if (ctxt.target.getMetadata('@ajs:defuseAdvices')) {
        return this.strategy.callJoinpoint(ctxt, compiledSymbol);
      }

      // create the joinpoint for the original method
      ctxt.joinpoint = (...args: any[]) => {
        ctxt.args = args;

        try {
          this.strategy.before(ctxt);

          this.strategy.callJoinpoint(ctxt, compiledSymbol);

          return this.strategy.afterReturn(ctxt);
        } catch (error) {
          // consider WeavingErrors as not recoverable by an aspect
          if (error instanceof WeavingError) {
            throw error;
          }

          ctxt.error = error;
          return this.strategy.afterThrow(ctxt);
        } finally {
          this.strategy.after(ctxt);
        }
      };

      const returnValue = this.strategy.around(ctxt)(...args);

      if (isAbstractToken(returnValue)) {
        throw new WeavingError(
          `${ctxt.target} returned "abstract()" token. "abstract()" is meant to be superseded by a @AfterReturn advice or an @Around advice.`,
        );
      }
      return returnValue;
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
