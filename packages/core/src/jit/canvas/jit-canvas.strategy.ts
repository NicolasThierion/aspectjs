import { assert, isUndefined } from '@aspectjs/common/utils';

import { AdvicesSelection } from '../../advice/registry/advices-selection.model';
import { AdviceError } from '../../errors/advice.error';
import { PointcutType } from '../../pointcut/pointcut.type';
import { JoinPointFactory } from '../joinpoint.factory';

import type { AdviceContext } from './../../advice/advice.context';

import type { JoinPoint } from '../../advice/joinpoint';

import type {
  CompiledSymbol,
  WeaverCanvasStrategy,
} from '../../weaver/canvas/canvas-strategy.type';

import { MutableAdviceContext } from '../../advice/mutable-advice.context';
import type { AdviceEntry } from '../../advice/registry/advice-entry.model';
import type { PointcutTargetType } from '../../pointcut/pointcut-target.type';
import type { WeaverContext } from '../../weaver/context/weaver.context';
export abstract class JitWeaverCanvasStrategy<
  T extends PointcutTargetType = PointcutTargetType,
  X = unknown,
> implements WeaverCanvasStrategy<T, X>
{
  constructor(
    protected readonly weaverContext: WeaverContext,
    protected readonly targetType: T,
  ) {}

  abstract compile(
    ctxt: MutableAdviceContext<T, X>,
    selection: AdvicesSelection,
  ): CompiledSymbol<T, X> | undefined;
  // TODO: remove ?
  // advices.forEach((a) => {
  //     if (Reflect.getOwnMetadata('@aspectjs::isCompiled', a, ctxt.target.ref)) {
  //         // prevent @Compile advices to be called twice
  //         throw new AdviceError(a, `Advice already applied`);
  //     }
  //     Reflect.defineMetadata('@aspectjs::isCompiled', true, a, ctxt.target.ref);
  // });

  before(ctxt: MutableAdviceContext<T, X>, selection: AdvicesSelection): void {
    this._applyNotReturn(
      () => ctxt.asBeforeContext(),
      selection.find(this.targetType, PointcutType.BEFORE),
    );
  }

  after(ctxt: MutableAdviceContext<T, X>, selection: AdvicesSelection): void {
    this._applyNotReturn(
      () => ctxt.asAfterContext(),
      selection.find(this.targetType, PointcutType.AFTER),
    );
  }

  afterReturn(
    ctxt: MutableAdviceContext<T, X>,
    selection: AdvicesSelection,
  ): T {
    const advices = [
      ...selection.find(this.targetType, PointcutType.AFTER_RETURN),
    ];
    if (!advices.length) {
      return ctxt.value as T;
    }
    const afterReturnContext = ctxt.asAfterReturnContext();

    advices.forEach((advice) => {
      const newContext = afterReturnContext;
      ctxt.value = this.callAdvice(advice, [newContext, ctxt.value]);
    });

    return ctxt.value as T;
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
    if (adviceEntries.length) {
      const errorContext = ctxt.asAfterThrowContext();
      adviceEntries.forEach((entry) => {
        value = this.callAdvice(entry, [errorContext, errorContext.error]);
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
      assert(!!ctxt.error);
      // pass-trough errors by default
      throw ctxt.error;
    }
  }

  around(
    ctxt: MutableAdviceContext<T, X>,
    advicesEntries: AdvicesSelection,
    allowReturn = true,
  ): JoinPoint {
    const advices = [
      ...advicesEntries.find(this.targetType, PointcutType.AROUND),
    ];
    if (!advices.length) {
      return ctxt.joinpoint!;
    }
    const aroundContext = ctxt.asAroundContext();
    let jp = aroundContext.joinpoint;
    advices
      // TODO: why reverse ?
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
          value = this.callAdvice(entry, [newContext, nextJp, args]);
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
    contextCreator: () => AdviceContext<T, X>,
    adviceEntries: Iterable<AdviceEntry<T>>,
  ) {
    const advices = [...adviceEntries];
    if (!advices.length) {
      return;
    }
    const ctxt = contextCreator();
    advices.forEach((entry) => {
      const retVal = this.callAdvice(entry, [ctxt, ctxt.args]);
      if (!isUndefined(retVal)) {
        throw new AdviceError(
          entry.advice,
          ctxt.target,
          `Returning from advice is not supported`,
        );
      }
    });
  }

  protected callAdvice(adviceEntry: AdviceEntry<T>, args: unknown[]): unknown {
    // accessing ctxt.value inside within a "before" advices will call the advice itself... prevent this.
    // if (getMetadata('@aspectjs::called', adviceEntry)) {
    //   return this.callJoinpoint(ctxt, compiledSymbol);
    // }

    return (adviceEntry.advice as any).apply(adviceEntry.aspect, args);
  }
}
