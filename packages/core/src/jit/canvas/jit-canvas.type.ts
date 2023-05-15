import { assert } from '@aspectjs/common/utils';

import { WeavingError } from '../../errors/weaving.error';

import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';

import { MutableAdviceContext } from '../../advice/mutable-advice.context';
import type { AdvicesSelection } from '../../advice/registry/advices-selection.model';
import type { CompiledSymbol } from '../../weaver/canvas/canvas-strategy.type';
import type { JitWeaverCanvasStrategy } from './jit-canvas.strategy';

export interface CompiledCanvas<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> {
  compiledSymbol: CompiledSymbol<T, X> | undefined;
  link: () => CompiledSymbol<T, X> | undefined | void;
}
export class JitWeaverCanvas<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> {
  private compiled = false;

  constructor(private readonly strategy: JitWeaverCanvasStrategy<T, X>) {}

  compile<C extends MutableAdviceContext<T, X>>(
    ctxt: C,
    selection: AdvicesSelection,
  ): CompiledCanvas<T, X> {
    if (this.compiled) {
      throw new WeavingError(
        `Canvas for ${ctxt.target.proto.constructor.name} already compiled`,
      );
    }

    if (selection.find().next().done) {
      return {
        compiledSymbol: undefined,
        link: () => {},
      };
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
          withinAdviceSafeguard = false;
        }
      };
      withinAdviceSafeguard = true;

      ctxt.value = null;
      ctxt.args = args;
      ctxt.instance = instance;
      ctxt.joinpoint = joinpoint;
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
