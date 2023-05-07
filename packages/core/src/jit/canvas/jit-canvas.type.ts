import { assert } from '@aspectjs/common/utils';

import { WeavingError } from '../../errors/weaving.error';

import type { MutableAdviceContext } from './../../advice/advice.context';

import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';

import type { AdvicesSelection } from '../../advice/registry/advices-selection.model';
import type { CompiledSymbol } from '../../weaver/canvas/canvas-strategy.type';
import type { JitWeaverCanvasStrategy } from './jit-canvas.strategy';

export class JitWeaverCanvas<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> {
  private compiled = false;

  constructor(private readonly strategy: JitWeaverCanvasStrategy<T, X>) {}

  compile<C extends MutableAdviceContext<T, X>>(
    ctxt: C,
    selection: AdvicesSelection,
  ): {
    link: () => CompiledSymbol<T, X>;
  } {
    if (this.compiled) {
      throw new WeavingError(
        `Canvas for ${ctxt.target.proto.constructor.name} already compiled`,
      );
    }

    const compiledSymbol = this.strategy.compile(ctxt, selection);
    this.compiled = true;
    if (!compiledSymbol) {
      assert(false);
      throw new WeavingError(
        `${
          Reflect.getPrototypeOf(this.strategy)!.constructor.name
        }.compile() did not returned a symbol`,
      );
    }
    /**
     * Returns a function that executes the plan for the Before, Around, AfterReturn, AfterThrow & After advices.
     */
    return {
      link: () => {
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
              withinAdviceSafeguard = false;
              this.strategy.after(ctxt, selection);
            }
          };
          withinAdviceSafeguard = true;

          ctxt.value = null;
          ctxt.args = args;
          ctxt.instance = instance;
          ctxt.joinpoint = joinpoint;
          return this.strategy.around(ctxt, selection)(...args);
        };

        return (
          this.strategy.finalize(ctxt, compiledSymbol, bootstrapJp) ??
          compiledSymbol
        );
      },
    };
  }
}
