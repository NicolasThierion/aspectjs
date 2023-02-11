import { assert, isUndefined } from '@aspectjs/common/utils';

import { AdvicesSelection } from '../../advice/registry/advices-selection.model';
import { AdviceError } from '../../errors/advice.error';
import { PointcutType } from '../../pointcut/pointcut-phase.type';
import { JoinPointFactory } from '../joinpoint.factory';

import type {
  AdviceContext,
  MutableAdviceContext,
} from './../../advice/advice.context';

import type { JoinPoint } from '../../advice/joinpoint';

import type {
  CompiledSymbol,
  WeaverCanvasStrategy,
} from '../../weaver/canvas/canvas-strategy.type';

import type { AdviceEntry } from '../../advice/registry/advice-entry.model';
import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';
import type { WeaverContext } from '../../weaver/context/weaver.context';
export abstract class JitWeaverCanvasStrategy<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> implements WeaverCanvasStrategy<T, X>
{
  constructor(
    private readonly targetType: T,
    private readonly weaverContext: WeaverContext,
  ) {}

  abstract compile(
    ctxt: MutableAdviceContext<T, X>,
    selection: AdvicesSelection,
  ): CompiledSymbol<T, X>;
  // TODO remove ?
  // advices.forEach((a) => {
  //     if (Reflect.getOwnMetadata('@aspectjs::isCompiled', a, ctxt.target.ref)) {
  //         // prevent @Compile advices to be called twice
  //         throw new AdviceError(a, `Advice already applied`);
  //     }
  //     Reflect.defineMetadata('@aspectjs::isCompiled', true, a, ctxt.target.ref);
  // });

  before(ctxt: MutableAdviceContext<T, X>, selection: AdvicesSelection): void {
    this._applyNotReturn(
      ctxt.asBeforeContext(),
      // compiledSymbol,
      selection.find(this.targetType, PointcutType.BEFORE),
    );
  }

  after(ctxt: MutableAdviceContext<T, X>, selection: AdvicesSelection): void {
    this._applyNotReturn(
      ctxt.asAfterContext(),
      // compiledSymbol,
      selection.find(this.targetType, PointcutType.AFTER),
    );
  }

  afterReturn(
    ctxt: MutableAdviceContext<T, X>,
    selection: AdvicesSelection,
  ): T {
    let value = ctxt.value;
    [...selection.find(this.targetType, PointcutType.AFTER_RETURN)].forEach(
      (advice) => {
        const newContext = ctxt.asAfterContext();
        value = this._safeCallAdvice(
          // newContext as any,
          //  compiledSymbol,
          advice,
          [newContext, value],
        );
      },
    );

    return value as T;
  }

  afterThrow(
    ctxt: MutableAdviceContext<T, X>,
    advicesSelection: AdvicesSelection,
    allowReturn = true,
  ): any {
    const adviceEntries = [
      ...advicesSelection.find(this.targetType, PointcutType.AFTER_THROW),
    ];

    let value: any;
    const errorContext = ctxt.asAfterThrowContext();
    if (adviceEntries.length) {
      adviceEntries.forEach((entry) => {
        value = this._safeCallAdvice(
          // ctxt,
          //  compiledSymbol,
          entry,
          [errorContext, errorContext.error],
        );
        if (!allowReturn && !isUndefined(value)) {
          throw new AdviceError(
            entry.advice,
            errorContext.target,
            `Returning from advice is not supported`,
          );
        }
      });
      return value;
    } else {
      assert(!!errorContext.error);
      // pass-trough errors by default
      throw errorContext.error;
    }
  }

  around(
    ctxt: MutableAdviceContext<T, X>,
    advicesEntries: AdvicesSelection,
    allowReturn = true,
  ): JoinPoint {
    const aroundContext = ctxt.asAroundContext();
    let jp = aroundContext.joinpoint;
    [...advicesEntries.find(this.targetType, PointcutType.AROUND)]
      // TODO why reverse ?
      .reverse()
      .forEach((entry) => {
        const originalJp = aroundContext.joinpoint;
        const nextJp = this.weaverContext
          .get(JoinPointFactory)
          .create(entry.advice, aroundContext, (...args: unknown[]) =>
            originalJp(args),
          );
        jp = (...args: unknown[]) => {
          let value = ctxt.value;
          const newContext = {
            ...ctxt,
            joinpoint: nextJp,
            args,
          };
          value = this._safeCallAdvice(
            // newContext,
            //  compiledSymbol,
            entry,
            [newContext, nextJp, args],
          );
          if (value !== undefined && !allowReturn) {
            throw new AdviceError(
              entry.advice,
              ctxt.target,
              // TODO why ?
              `Returning from advice is not supported`,
            );
          }
          return value;
        };
      });

    return jp;
  }

  abstract callJoinpoint(
    ctxt: MutableAdviceContext<T, X>,
    originalSymbol: CompiledSymbol<T, X>,
  ): void;

  abstract finalize(
    ctxt: MutableAdviceContext<T, X>,
    joinpoint: (...args: any[]) => unknown,
  ): CompiledSymbol<T, X>;

  /**
   *
   * @param ctxt Apply advices that should not return
   * @param compiledSymbol
   * @param adviceEntries
   */
  protected _applyNotReturn(
    ctxt: AdviceContext<T, X>,
    // originalSymbol: CompiledSymbol<T, X>,
    adviceEntries: Iterable<AdviceEntry<T>>,
  ) {
    [...adviceEntries].forEach((entry) => {
      const retVal = this._safeCallAdvice(
        // ctxt,
        //  originalSymbol,
        entry,
        [ctxt, ctxt.args],
      );
      if (!isUndefined(retVal)) {
        throw new AdviceError(
          entry.advice,
          ctxt.target,
          `Returning from advice is not supported`,
        );
      }
    });
  }

  private _safeCallAdvice(
    // ctxt: AdviceContext<T, X>,
    adviceEntry: AdviceEntry<T>,
    args: unknown[],
  ): unknown {
    // accessing ctxt.value inside within a "before" advices will call the advice itself... prevent this.
    // if (getMetadata('@aspectjs::called', adviceEntry)) {
    //   return this.callJoinpoint(ctxt, compiledSymbol);
    // }

    return (adviceEntry.advice as any).apply(adviceEntry.aspect, args);
  }
}
