import { JoinpointType } from '../../pointcut/pointcut-target.type';

import {
  defineMetadata,
  getMetadata,
  MethodPropertyDescriptor,
} from '@aspectjs/common/utils';
import { AdviceType } from '../../advice/advice-type.type';
import { MutableAdviceContext } from '../../advice/mutable-advice.context';
import { AdviceEntry } from '../../advice/registry/advice-entry.model';
import { AdvicesSelection } from '../../advice/registry/advices-selection.model';
import type { WeaverContext } from '../../weaver/context/weaver.context';
import { AbstractJitMethodCanvasStrategy } from './jit-method-canvas.strategy';

const _defineProperty = Object.defineProperty;

/**
 * Canvas to advise parameters
 */
export class JitParameterCanvasStrategy<
  X = unknown,
> extends AbstractJitMethodCanvasStrategy<JoinpointType.PARAMETER, X> {
  constructor(weaverContext: WeaverContext) {
    super(weaverContext, [JoinpointType.PARAMETER]);
  }

  override compile(
    ctxt: MutableAdviceContext<JoinpointType.PARAMETER, X>,
    selection: AdvicesSelection,
  ): MethodPropertyDescriptor {
    const compiledDescriptor = super.compile(ctxt, selection);

    // save original descriptor.
    // Used later to prevent Reflect.decorate to restore this descriptor
    // and cancel the enhanced parameter
    const originalDescriptor = Reflect.getOwnPropertyDescriptor(
      ctxt.target.proto,
      ctxt.target.propertyKey,
    );

    defineMetadata(
      'aspectjs:originalDescriptor',
      originalDescriptor,
      ctxt.target.proto,
      ctxt.target.propertyKey,
    );
    return compiledDescriptor;
  }

  protected override getAdviceEntries<P extends AdviceType>(
    selection: AdvicesSelection,
    pointcutType: P,
  ): AdviceEntry<JoinpointType.PARAMETER, X, P>[] {
    return [...selection.find([JoinpointType.PARAMETER], [pointcutType])];
  }

  override link(
    ctxt: MutableAdviceContext<JoinpointType.PARAMETER, X>,
    compiledSymbol: MethodPropertyDescriptor,
    joinpoint: (...args: any[]) => unknown,
  ): MethodPropertyDescriptor {
    const methodDescriptor = super.link(ctxt, compiledSymbol, joinpoint);

    preventResetMethodDescriptor(ctxt, methodDescriptor);
    return methodDescriptor as any;
  }
}
function preventResetMethodDescriptor<X>(
  ctxt: MutableAdviceContext<JoinpointType.PARAMETER, X>,
  methodDescriptor: PropertyDescriptor,
) {
  // Override method descriptor from parameter decorator is not allowed because return value of parameter decorators are ignored.
  // Moreover, Reflect.decorate will overwrite any changes made on proto[propertyKey]
  // To prevent this, we monkey patch Object.defineProperty;
  Object.defineProperty = function (
    o: any,
    p: PropertyKey,
    attributes: PropertyDescriptor & ThisType<any>,
  ) {
    if (o === ctxt.target.proto && p === ctxt.target.propertyKey) {
      const originalDescriptor = getMetadata(
        'aspectjs:originalDescriptor',
        ctxt.target.proto,
        ctxt.target.propertyKey,
      );
      // prevent writing back old descriptor
      if (equals(originalDescriptor, attributes)) {
        // restore original defineProperty method
        Object.defineProperty = _defineProperty;
        return Object.defineProperty(o, p, methodDescriptor);
      } else {
        return _defineProperty(o, p, attributes);
      }
    }
    return _defineProperty(o, p, attributes);
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
