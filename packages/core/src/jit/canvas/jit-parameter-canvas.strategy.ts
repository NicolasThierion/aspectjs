import { PointcutKind } from '../../pointcut/pointcut-kind.type';

import { MethodPropertyDescriptor } from '@aspectjs/common/utils';
import { AdviceKind } from '../../advice/advice-type.type';
import { MutableAdviceContext } from '../../advice/mutable-advice.context';
import { AdviceEntry } from '../../advice/registry/advice-entry.model';
import { AdvicesSelection } from '../../advice/registry/advices-selection.model';
import type { WeaverContext } from '../../weaver/context/weaver.context';
import { AbstractJitMethodCanvasStrategy } from './jit-abstract-method-canvas.strategy';

const _defineProperty = Object.defineProperty;

/**
 * Canvas to advise parameters
 */
export class JitParameterCanvasStrategy<
  X = unknown,
> extends AbstractJitMethodCanvasStrategy<PointcutKind.PARAMETER, X> {
  constructor(weaverContext: WeaverContext, advices: AdvicesSelection) {
    super(weaverContext, advices, [PointcutKind.PARAMETER]);
  }

  protected override getAdviceEntries<P extends AdviceKind>(
    pointcutKind: P,
  ): AdviceEntry<PointcutKind.PARAMETER, X, P>[] {
    return [...this.advices.find([PointcutKind.PARAMETER], [pointcutKind])];
  }

  override link(
    ctxt: MutableAdviceContext<PointcutKind.PARAMETER, X>,
    compiledSymbol: MethodPropertyDescriptor,
    joinpoint: (...args: any[]) => unknown,
  ): MethodPropertyDescriptor {
    const methodDescriptor = super.link(ctxt, compiledSymbol, joinpoint);

    preventRevertMethodDescriptor(ctxt, methodDescriptor);
    return methodDescriptor as any;
  }
}
function preventRevertMethodDescriptor<X>(
  ctxt: MutableAdviceContext<PointcutKind.PARAMETER, X>,
  methodDescriptor: PropertyDescriptor,
) {
  // save original descriptor.
  // Used later to prevent Reflect.decorate to restore this descriptor
  // and cancel the enhanced parameter
  ctxt.target.getMetadata('aspectjs:originalDescriptor', () => {
    return Reflect.getOwnPropertyDescriptor(
      ctxt.target.proto,
      ctxt.target.propertyKey,
    );
  });

  // Override method descriptor from parameter decorator is not allowed because return value of parameter decorators are ignored.
  // Moreover, Reflect.decorate will overwrite any changes made on proto[propertyKey]
  // To prevent this, we monkey patch Object.defineProperty;
  Object.defineProperty = function (
    target: any,
    property: PropertyKey,
    propertyDescriptor: PropertyDescriptor & ThisType<any>,
  ) {
    if (target === ctxt.target.proto && property === ctxt.target.propertyKey) {
      const originalDescriptor = ctxt.target.getMetadata(
        'aspectjs:originalDescriptor',
      );
      // prevent writing back old descriptor
      if (equals(originalDescriptor, propertyDescriptor)) {
        // restore original defineProperty method
        Object.defineProperty = _defineProperty;
        return Object.defineProperty(target, property, methodDescriptor);
      } else {
        return _defineProperty(target, property, propertyDescriptor);
      }
    }
    return _defineProperty(target, property, propertyDescriptor);
  };
}

function equals(obj1: any, obj2: any): boolean {
  for (const e of Object.entries(obj1)) {
    const [k, v] = e;
    if (obj2[k] !== v) {
      return false;
    }
  }

  return true;
}
