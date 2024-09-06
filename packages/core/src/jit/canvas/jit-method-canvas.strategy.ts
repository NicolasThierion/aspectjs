import { PointcutType } from '../../pointcut/pointcut-target.type';

import { MethodPropertyDescriptor } from '@aspectjs/common/utils';
import { AdviceType } from '../../advice/advice-type.type';
import { JoinPoint } from '../../advice/joinpoint';
import { MutableAdviceContext } from '../../advice/mutable-advice.context';
import { AdviceEntry } from '../../advice/registry/advice-entry.model';
import { AdvicesSelection } from '../../advice/registry/advices-selection.model';
import type { WeaverContext } from '../../weaver/context/weaver.context';
import { AbstractJitMethodCanvasStrategy } from './jit-abstract-method-canvas.strategy';
import { JitParameterCanvasStrategy } from './jit-parameter-canvas.strategy';

export class JitMethodCanvasStrategy<
  X = unknown,
> extends AbstractJitMethodCanvasStrategy<PointcutType.METHOD, X> {
  // appart from @Compile advices, calling a method should search for method advices & parameter advices as well.
  // as @Compile advice for method overrides compiled parameter's canvas, remember to delecase to parameter canvas here.
  private readonly parameterCanvasStrategy?: JitParameterCanvasStrategy<unknown>;
  constructor(
    weaverContext: WeaverContext,
    advices: AdvicesSelection,
    parameterAdvices?: AdvicesSelection,
  ) {
    super(weaverContext, advices, [PointcutType.METHOD]);
    this.parameterCanvasStrategy = parameterAdvices
      ? new JitParameterCanvasStrategy(weaverContext, parameterAdvices)
      : undefined;
  }

  override before(
    ctxt: MutableAdviceContext<PointcutType.METHOD | PointcutType.PARAMETER, X>,
  ): void {
    this.parameterCanvasStrategy?.before(ctxt);
    super.before(ctxt);
  }

  override around(
    ctxt: MutableAdviceContext<PointcutType.METHOD | PointcutType.PARAMETER, X>,

    allowReturn?: boolean,
  ): JoinPoint {
    ctxt.joinpoint = this.parameterCanvasStrategy
      ? this.parameterCanvasStrategy.around(ctxt, allowReturn)
      : ctxt.joinpoint;
    return super.around(ctxt, allowReturn);
  }

  override afterReturn(
    ctxt: MutableAdviceContext<PointcutType.METHOD | PointcutType.PARAMETER, X>,
  ): unknown {
    ctxt.value = this.parameterCanvasStrategy
      ? this.parameterCanvasStrategy.afterReturn(ctxt)
      : ctxt.value;
    return super.afterReturn(ctxt);
  }

  override afterThrow(
    ctxt: MutableAdviceContext<PointcutType.METHOD | PointcutType.PARAMETER, X>,
  ): unknown {
    try {
      if (this.parameterCanvasStrategy) {
        ctxt.value = this.parameterCanvasStrategy.afterThrow(ctxt);
        return ctxt.value;
      }
    } catch (newError) {
      ctxt.error = newError;
    }

    return super.afterThrow(ctxt);
  }

  override after(
    ctxt: MutableAdviceContext<PointcutType.METHOD | PointcutType.PARAMETER, X>,
  ): void {
    this.parameterCanvasStrategy?.after(ctxt);
    return super.after(ctxt);
  }

  protected override getAdviceEntries<P extends AdviceType>(
    pointcutType: P,
  ): AdviceEntry<PointcutType.METHOD, X, P>[] {
    return [...this.advices.find([PointcutType.METHOD], [pointcutType])];
  }

  override compile(
    ctxt: MutableAdviceContext<PointcutType.METHOD, X>,
  ): MethodPropertyDescriptor {
    return super.compile(ctxt) as MethodPropertyDescriptor;
  }

  override link(
    ctxt: MutableAdviceContext<PointcutType.METHOD, X>,
    compiledSymbol: MethodPropertyDescriptor,
    joinpoint: (...args: any[]) => unknown,
  ): MethodPropertyDescriptor {
    return super.link(
      ctxt,
      compiledSymbol,
      joinpoint,
    ) as MethodPropertyDescriptor;
  }
}
