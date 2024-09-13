import { assert, getPrototype } from '@aspectjs/common/utils';

import { WeavingError } from '../../errors/weaving.error';

import type { PointcutType } from '../../pointcut/pointcut-target.type';

import {
  Annotation,
  AnnotationContextRegistry,
  AnnotationTargetFactory,
  reflectContext,
} from '@aspectjs/common';
import { MutableAdviceContext } from '../../advice/mutable-advice.context';
import type { CompiledSymbol } from '../../weaver/canvas/canvas-strategy.type';
import { _CompilationState } from '../../weaver/compilation-state.provider';
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
    // in fact, this condition makes it impossible to enable aspects lately, so we enhance the target anyway
    // if (selection.find().next().done) {
    //   return {
    //     compiledSymbol: undefined,
    //     link: () => {},
    //   };
    // }

    // leak advices selection, as compile advices such as mixins may have to add their own annotations
    // to the advice filters
    const state = reflectContext().get(_CompilationState);
    state.status = _CompilationState.Status.PENDING;
    state.advices = this.strategy.advices;

    const compiledSymbol = this.strategy.compile(ctxt);
    if (!compiledSymbol) {
      assert(false);
    }

    delete state.advices;
    state.status = _CompilationState.Status.DONE;

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
        // actual prototype can differ from context.target.proto if we are in a subclass
        if (
          ctxt.instance &&
          getPrototype(ctxt.instance) !== ctxt.target.proto
        ) {
          const [_proto, propertyKey, parameterIndex] =
            ctxt.target.asDecoratorArgs();
          const actualTarget = reflectContext()
            .get(AnnotationTargetFactory)
            .of(instance, propertyKey, parameterIndex);

          const annotations = (...annotations: Annotation[]) => {
            return reflectContext()
              .get(AnnotationContextRegistry)
              .select(...annotations)
              .on({
                target: actualTarget,
                // types: [target.type]
              });
          };
          ctxt = new MutableAdviceContext({
            ...ctxt,
            target: actualTarget,
            annotations,
          }) as C;
          ctxt.bind(ctxt.instance!);
        }

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

      const returnValue = this.strategy.handleReturnValue(
        ctxt,
        this.strategy.around(ctxt)(...args),
      );

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
