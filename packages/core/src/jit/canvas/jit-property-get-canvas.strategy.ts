import { assert, getMetadata, isUndefined } from '@aspectjs/common/utils';

import { PointcutType } from '../../pointcut/pointcut-phase.type';
import { PointcutTargetType } from '../../pointcut/pointcut-target.type';
import { JitWeaverCanvasStrategy } from './jit-canvas.strategy';

import type { MutableAdviceContext } from '../../advice/advice.context';
import { JoinPoint } from '../../advice/joinpoint';
import type { AdvicesSelection } from '../../advice/registry/advices-selection.model';
import { AdviceError } from '../../errors/advice.error';
import { CompiledSymbol } from '../../weaver/canvas/canvas-strategy.type';
import type { WeaverContext } from '../../weaver/context/weaver.context';

/**
 * Canvas to advise propertiy getters
 */
export class JitPropertyGetCanvas<X = unknown> extends JitWeaverCanvasStrategy<
  PointcutTargetType.GET_PROPERTY,
  X
> {
  constructor(weaverContext: WeaverContext) {
    super(PointcutTargetType.GET_PROPERTY, weaverContext);
  }

  compile(
    ctxt: MutableAdviceContext<PointcutTargetType.GET_PROPERTY, X>,
    selection: AdvicesSelection,
  ): PropertyDescriptor {
    assert(!!ctxt.target.propertyKey);
    const target = ctxt.target;
    // if (this.compiledDescriptor) {
    //   return this.compiledDescriptor;
    // }

    // if another @Compile advice has been applied
    // replace advised descriptor by original descriptor before it gets advised again
    const oldDescriptor = getMetadata(
      '@aspectjs:jitPropertyCanvas',
      ctxt.target.proto,
      ctxt.target.propertyKey,
      () =>
        ctxt.target.descriptor ??
        createPropertyDescriptor(ctxt.target.propertyKey),
      true,
    );

    //  if no prop advices, return descriptor as is
    if (selection.find().next().done) {
      return oldDescriptor;
    }

    const conpileAdviceEntries = [
      ...selection.find(PointcutTargetType.GET_PROPERTY, PointcutType.COMPILE),
    ];

    const newDescriptor: PropertyDescriptor =
      conpileAdviceEntries
        .map((entry) => {
          assert(typeof entry === 'function');
          // TODO do not call all @Compile advices. Only the one with highest precedence
          const descriptor = entry.advice.call(
            entry.aspect,
            ctxt.asCompileContext(),
          );

          if (descriptor && oldDescriptor.configurable === false) {
            throw new AdviceError(
              entry.advice,
              ctxt.target,
              `${target.label} is not configurable`,
            );
          }

          return descriptor;
        })
        .filter((descriptor) => !!descriptor)
        .map((descriptor) => this.normalizeDescriptor(descriptor))
        .reverse()[0] ?? oldDescriptor;

    Reflect.defineProperty(target.proto, target.propertyKey, newDescriptor);

    return newDescriptor;
  }

  override callJoinpoint(
    ctxt: MutableAdviceContext<PointcutTargetType.GET_PROPERTY, X>,
    originalSymbol: PropertyDescriptor,
  ): void {
    assert(!!ctxt.args);
    ctxt.value = originalSymbol.get?.() ?? originalSymbol.value;
  }

  finalize(
    ctxt: MutableAdviceContext<PointcutTargetType.GET_PROPERTY, X>,
    compiledSymbol: CompiledSymbol<PointcutTargetType.GET_PROPERTY, X>,
    joinpoint: (...args: any[]) => unknown,
  ): PropertyDescriptor {
    assert(!!ctxt.target?.proto);

    return wrapDescriptor(compiledSymbol, joinpoint);
  }

  private normalizeDescriptor(descriptor: PropertyDescriptor): any {
    // test property validity
    const surrogate = { prop: '' };
    const surrogateProp = Reflect.getOwnPropertyDescriptor(surrogate, 'prop')!;
    if (isUndefined(descriptor.enumerable)) {
      descriptor.enumerable = surrogateProp.enumerable;
    }

    if (isUndefined(descriptor.configurable)) {
      descriptor.configurable = surrogateProp.configurable;
    }

    Object.defineProperty(surrogate, 'newProp', descriptor);

    // normalize the descriptor
    descriptor = Object.getOwnPropertyDescriptor(surrogate, 'newProp')!;

    return descriptor;
  }
}

function createPropertyDescriptor(propertyName: string): PropertyDescriptor {
  const surrogate = { [propertyName]: '' };
  const surrogateDescriptor = Reflect.getOwnPropertyDescriptor(
    surrogate,
    propertyName,
  )!;

  return surrogateDescriptor;
}
function wrapDescriptor(
  oldDescriptor: TypedPropertyDescriptor<unknown>,
  joinPoint: JoinPoint,
): PropertyDescriptor {
  return {
    configurable: true,
    enumerable: true,
    get() {
      return joinPoint(this);
    },
    set(value: any) {
      if (oldDescriptor.set) {
        return oldDescriptor.set(value);
      }
      oldDescriptor.value = value;
    },
  };
}
