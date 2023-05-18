import { MethodPropertyDescriptor } from '@aspectjs/common';

import { PointcutTargetType } from '../../pointcut/pointcut-target.type';

import { assert, defineMetadata, getMetadata } from '@aspectjs/common/utils';
import { MutableAdviceContext } from '../../advice/mutable-advice.context';
import { AdviceEntry } from '../../advice/registry/advice-entry.model';
import { AdvicesSelection } from '../../advice/registry/advices-selection.model';
import { PointcutType } from '../../public_api';
import type { WeaverContext } from '../../weaver/context/weaver.context';
import { AbstractJitMethodCanvasStrategy } from './jit-method-canvas.strategy';

const _defineProperty = Object.defineProperty;

/**
 * Canvas to advise parameters
 */
export class JitParameterCanvasStrategy<
  X = unknown,
> extends AbstractJitMethodCanvasStrategy<PointcutTargetType.PARAMETER, X> {
  constructor(weaverContext: WeaverContext) {
    super(weaverContext, PointcutTargetType.PARAMETER);
  }

  protected override getAdviceEntries(
    selection: AdvicesSelection,
  ): AdviceEntry<PointcutTargetType.PARAMETER, X, PointcutType.COMPILE>[] {
    return [
      ...selection.find(PointcutTargetType.PARAMETER, PointcutType.COMPILE),
    ];
  }

  override link(
    ctxt: MutableAdviceContext<PointcutTargetType.PARAMETER, X>,
    compiledSymbol: MethodPropertyDescriptor,
    joinpoint: (...args: any[]) => unknown,
  ): MethodPropertyDescriptor {
    const methodDescriptor = super.link(ctxt, compiledSymbol, joinpoint);

    patchParameterReflectDecorator(ctxt, methodDescriptor);
    return methodDescriptor as any;
  }
}
function patchParameterReflectDecorator<X>(
  ctxt: MutableAdviceContext<PointcutTargetType.PARAMETER, X>,
  methodDescriptor: MethodPropertyDescriptor,
) {
  defineMetadata('aspectjs.enhancedMethodDescriptor', true, methodDescriptor);

  // Override method descriptor from parameter decorator is not allowed because return value of this parameter decorators is ignored
  // Moreover, Reflect.decorate will overwrite any changes made on proto[propertyKey]
  // We monkey patch Object.defineProperty to prevent this;
  Object.defineProperty = function (
    o: any,
    p: PropertyKey,
    attributes: PropertyDescriptor & ThisType<any>,
  ) {
    if (o === ctxt.target.proto && p === ctxt.target.propertyKey) {
      // restore original defineProperty method
      Object.defineProperty = _defineProperty;

      // if attempt to write an enhanced descriptor... let go
      if (getMetadata('aspectjs.enhancedMethodDescriptor', attributes)) {
        assert(false);
        return Object.defineProperty(o, p, attributes);
      } else {
        // prevent writing back old descriptor
        return Object.defineProperty(o, p, methodDescriptor);
      }
    }

    return _defineProperty(o, p, attributes);
  };
}
