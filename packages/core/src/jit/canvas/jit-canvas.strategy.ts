import { assert, isUndefined } from '@aspectjs/common/utils';
import { JoinPoint } from './../../advice/joinpoint';

import { AdvicesSelection } from '../../advice/registry/advices-selection.model';
import { AdviceError } from '../../errors/advice.error';

import type { AdviceContext } from './../../advice/advice.context';

import type {
  CompiledSymbol,
  WeaverCanvasStrategy,
} from '../../weaver/canvas/canvas-strategy.type';

import { AdviceType } from '../../advice/advice-type.type';
import { MutableAdviceContext } from '../../advice/mutable-advice.context';
import type { AdviceEntry } from '../../advice/registry/advice-entry.model';
import type { PointcutType } from '../../pointcut/pointcut-target.type';
import type { WeaverContext } from '../../weaver/context/weaver.context';
import { JoinPointFactory } from '../joinpoint.factory';
export abstract class JitWeaverCanvasStrategy<
  T extends PointcutType = PointcutType,
  X = unknown,
> implements WeaverCanvasStrategy<T, X>
{
  constructor(
    protected readonly weaverContext: WeaverContext,
    public readonly pointcutTypes: T[],
  ) {}

  abstract compile(
    ctxt: MutableAdviceContext<T, X>,
    selection: AdvicesSelection,
  ): CompiledSymbol<T, X> | undefined;

  before(ctxt: MutableAdviceContext<T, X>, selection: AdvicesSelection): void {
    this._applyNotReturn(
      ctxt,
      () => ctxt.asBeforeContext(),
      selection.find(this.pointcutTypes, [AdviceType.BEFORE]),
    );
  }

  after(ctxt: MutableAdviceContext<T, X>, selection: AdvicesSelection): void {
    this._applyNotReturn(
      ctxt,

      () => ctxt.asAfterContext(),
      selection.find(this.pointcutTypes, [AdviceType.AFTER]),
    );
  }

  afterReturn(
    ctxt: MutableAdviceContext<T, X>,
    selection: AdvicesSelection,
  ): T {
    const advices = [
      ...selection.find(this.pointcutTypes, [AdviceType.AFTER_RETURN]),
    ];
    if (!advices.length) {
      return ctxt.value as T;
    }

    advices.forEach((advice) => {
      const afterReturnContext = ctxt.asAfterReturnContext();

      ctxt.value = this.callAdvice(advice, ctxt, [
        afterReturnContext,
        ctxt.value,
      ]);
    });

    return ctxt.value as T;
  }

  afterThrow(
    ctxt: MutableAdviceContext<T, X>,
    advicesSelection: AdvicesSelection,
    allowReturn = true,
  ): any {
    const adviceEntries = [
      ...advicesSelection.find(this.pointcutTypes, [AdviceType.AFTER_THROW]),
    ];

    if (!adviceEntries.length) {
      assert(!!ctxt.error);
      // pass-trough errors by default
      throw ctxt.error;
    }

    for (const entry of adviceEntries) {
      const errorContext = ctxt.asAfterThrowContext();
      try {
        ctxt.value = this.callAdvice(
          entry,
          ctxt,
          [errorContext, errorContext.error],
          allowReturn,
        );
        // advice did not throw, break;

        ctxt.error = undefined;
        break;
      } catch (error) {
        // advice did throw, continue the advice chain
        ctxt.error = error;
      }
    }

    if (ctxt.error) {
      throw ctxt.error;
    }
    return ctxt.value;
  }

  around(
    ctxt: MutableAdviceContext<T, X>,
    advicesEntries: AdvicesSelection,
    allowReturn = true,
  ): JoinPoint {
    const advices = [
      ...advicesEntries.find(this.pointcutTypes, [AdviceType.AROUND]),
    ];
    if (!advices.length) {
      return ctxt.joinpoint!;
    }
    const aroundContext = ctxt.asAroundContext();
    let jp = aroundContext.joinpoint;
    const jpFactory = this.weaverContext.get(JoinPointFactory);
    advices.reverse().forEach((entry) => {
      const originalJp = jp;
      const nextJp = jpFactory.create(
        entry.advice,
        aroundContext,
        (...args: unknown[]) => originalJp(...args),
      );
      jp = (...args: unknown[]) => {
        const newContext = ctxt.asAroundContext({
          joinpoint: nextJp,
        });
        ctxt.value = this.callAdvice(
          entry,
          ctxt,
          [newContext, nextJp, args],
          allowReturn,
        );

        return ctxt.value;
      };
    });

    return jp;
  }

  abstract callJoinpoint(
    ctxt: MutableAdviceContext<T, X>,
    originalSymbol: CompiledSymbol<T, X>,
  ): unknown;

  abstract link(
    ctxt: MutableAdviceContext<T, X>,
    compiledSymbol: CompiledSymbol<T, X>,
    joinpoint: (...args: any[]) => unknown,
  ): CompiledSymbol<T, X>;

  /**
   *
   * @param ctxt Apply advices that should not return
   * @param compiledSymbol
   * @param adviceEntries
   */
  protected _applyNotReturn(
    ctxt: MutableAdviceContext<T, X>,
    contextCreator: () => AdviceContext<T, X>,
    adviceEntries: Iterable<AdviceEntry<T>>,
  ) {
    const advices = [...adviceEntries];
    if (!advices.length) {
      return;
    }
    const newContext = contextCreator();
    advices.forEach((entry) => {
      this.callAdvice(entry, ctxt, [newContext, newContext.args], false);
    });
  }

  protected callAdvice(
    adviceEntry: AdviceEntry<T>,
    ctxt: MutableAdviceContext<T>,
    args: unknown[],
    allowReturn = true,
  ): unknown {
    const retVal = (adviceEntry.advice as any).apply(adviceEntry.aspect, args);
    if (!isUndefined(retVal) && !allowReturn) {
      throw new AdviceError(
        adviceEntry.aspect,
        adviceEntry.advice,
        ctxt.target,
        `Returning from advice is not supported`,
      );
    }
    return (ctxt.value = retVal);
  }
}
