import { PointcutType } from '../../pointcut/pointcut-target.type';

import { MethodPropertyDescriptor } from '@aspectjs/common/utils';
import { AdviceType } from '../../advice/advice-type.type';
import { MutableAdviceContext } from '../../advice/mutable-advice.context';
import { AdviceEntry } from '../../advice/registry/advice-entry.model';
import { AdvicesSelection } from '../../advice/registry/advices-selection.model';
import type { WeaverContext } from '../../weaver/context/weaver.context';
import { AbstractJitMethodCanvasStrategy } from './jit-abstract-method-canvas.strategy';
import { JitWeaverCanvas } from './jit-canvas.type';
import { JitParameterCanvasStrategy } from './jit-parameter-canvas.strategy';

export class JitMethodCanvasStrategy<
  X = unknown,
> extends AbstractJitMethodCanvasStrategy<PointcutType.METHOD, X> {
  constructor(
    weaverContext: WeaverContext,
    advices: AdvicesSelection,

    // appart from @Compile advices, calling a method should search for method advices & parameter advices as well.
    // as @Compile advice for method overrides compiled parameter's canvas, remember to delecase to parameter canvas here.
    private readonly parameterAdvices?: AdvicesSelection,
  ) {
    super(weaverContext, advices, [PointcutType.METHOD]);
  }

  protected override getAdviceEntries<P extends AdviceType>(
    pointcutType: P,
  ): AdviceEntry<PointcutType.METHOD, X, P>[] {
    return [...this.advices.find([PointcutType.METHOD], [pointcutType])];
  }

  override compile(
    ctxt: MutableAdviceContext<PointcutType.METHOD, X>,
  ): MethodPropertyDescriptor {
    if (this.parameterAdvices) {
      const methodDescriptor = super.compile(ctxt) as MethodPropertyDescriptor;
      const parameterCanvas = new JitWeaverCanvas(
        new _JitNestedParameterCanvasStrategy(
          this.weaverContext,
          this.parameterAdvices,
          methodDescriptor,
        ),
      );
      ctxt.joinpoint = (...args) => {
        return methodDescriptor.value(...args);
      };

      return parameterCanvas
        .compile(ctxt as any as MutableAdviceContext<PointcutType.PARAMETER, X>)
        .link() as MethodPropertyDescriptor;
    }

    return super.compile(ctxt) as MethodPropertyDescriptor;
  }
}

/**
 * Parameters canvas nested into a mathod canvas
 */
class _JitNestedParameterCanvasStrategy<
  X,
> extends JitParameterCanvasStrategy<X> {
  constructor(
    weaverContext: WeaverContext,
    advices: AdvicesSelection,
    private methodDescriptor: MethodPropertyDescriptor,
  ) {
    super(weaverContext, advices);
  }

  override compile(
    _ctxt: MutableAdviceContext<PointcutType.PARAMETER, X>,
  ): MethodPropertyDescriptor {
    // skip compilation as methodDescriptor already compiled
    return this.methodDescriptor;
  }
  override handleReturnValue(
    ctxt: MutableAdviceContext<PointcutType.PARAMETER, X>,
    returnValue: any,
  ) {
    // allow retuning abstract placeholders
    return (ctxt.value = returnValue);
  }
}
