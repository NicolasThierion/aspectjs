import { assert, getMetadata, isUndefined } from '@aspectjs/common/utils';

import { PointcutTargetType } from '../../pointcut/pointcut-target.type';
import { JitWeaverCanvasStrategy } from './jit-canvas.strategy';

import { JoinPoint } from '../../advice/joinpoint';
import { MutableAdviceContext } from '../../advice/mutable-advice.context';
import { AdvicesSelection } from '../../advice/registry/advices-selection.model';
import { AdviceError } from '../../errors/advice.error';
import { PointcutType } from '../../pointcut/pointcut.type';
import { CompiledSymbol } from '../../weaver/canvas/canvas-strategy.type';
import type { WeaverContext } from '../../weaver/context/weaver.context';
import { CompiledCanvas, JitWeaverCanvas } from './jit-canvas.type';
/**
 * Canvas to advise property getters and setters
 */
export class JitPropertyCanvasStrategy<
  X = unknown,
> extends JitWeaverCanvasStrategy<
  PointcutTargetType.GET_PROPERTY | PointcutTargetType.SET_PROPERTY,
  X
> {
  private propertySetterStrategy: JitPropertySetCanvasStrategy<X>;
  propertyCanvas!: CompiledCanvas<
    PointcutTargetType.GET_PROPERTY | PointcutTargetType.SET_PROPERTY,
    X
  >;

  constructor(weaverContext: WeaverContext) {
    super(weaverContext, PointcutTargetType.GET_PROPERTY);
    this.propertySetterStrategy = this.createPropertySetterStrategy();
  }

  compile(
    ctxt: MutableAdviceContext<
      PointcutTargetType.GET_PROPERTY | PointcutTargetType.SET_PROPERTY,
      X
    >,
    selection: AdvicesSelection,
  ): PropertyDescriptor | undefined {
    this.propertyCanvas = new JitWeaverCanvas(
      this.propertySetterStrategy,
    ).compile(new MutableAdviceContext<any, any>(ctxt), selection);

    return this.propertyCanvas.compiledSymbol!;
  }

  override callJoinpoint(
    ctxt: MutableAdviceContext<
      PointcutTargetType.GET_PROPERTY | PointcutTargetType.SET_PROPERTY,
      X
    >,
    originalSymbol: PropertyDescriptor,
  ): unknown {
    assert(!!ctxt.args);

    assert(
      this.targetType === PointcutTargetType.GET_PROPERTY ||
        this.targetType === PointcutTargetType.SET_PROPERTY,
    );
    assert(!ctxt.args?.length);
    ctxt.value =
      originalSymbol.get?.apply(ctxt.instance) ?? originalSymbol.value;
    return ctxt.value;
  }

  override link(
    ctxt: MutableAdviceContext<
      PointcutTargetType.GET_PROPERTY | PointcutTargetType.SET_PROPERTY,
      X
    >,
    compiledSymbol: CompiledSymbol<
      PointcutTargetType.GET_PROPERTY | PointcutTargetType.SET_PROPERTY,
      X
    >,
    getterJoinpoint: (...args: any[]) => unknown,
  ): PropertyDescriptor {
    assert(!!ctxt.target?.proto);

    compiledSymbol = {
      ...compiledSymbol,
      get() {
        return getterJoinpoint(this);
      },
      set: this.propertyCanvas.link()!.set,
    };

    delete compiledSymbol.value;
    delete compiledSymbol.writable;
    return compiledSymbol;
  }

  private createPropertySetterStrategy() {
    return new JitPropertySetCanvasStrategy(this.weaverContext);
  }
}

class JitPropertySetCanvasStrategy<X> extends JitWeaverCanvasStrategy<
  PointcutTargetType.GET_PROPERTY | PointcutTargetType.SET_PROPERTY,
  X
> {
  constructor(weaverContext: WeaverContext) {
    super(weaverContext, PointcutTargetType.SET_PROPERTY);
  }

  override callJoinpoint(
    ctxt: MutableAdviceContext<
      PointcutTargetType.GET_PROPERTY | PointcutTargetType.SET_PROPERTY,
      X
    >,
    originalSymbol: PropertyDescriptor,
  ): void {
    assert(!!ctxt.args);
    assert(ctxt.args?.length === 1);
    if (originalSymbol.set) {
      originalSymbol.set?.call(ctxt.instance, ctxt.args![0]);
    } else {
      originalSymbol.value = ctxt.args![0];
    }
  }

  override link(
    _ctxt: MutableAdviceContext<
      PointcutTargetType.GET_PROPERTY | PointcutTargetType.SET_PROPERTY,
      X
    >,
    compiledSymbol: PropertyDescriptor,
    joinpoint: JoinPoint,
  ): CompiledSymbol<
    PointcutTargetType.GET_PROPERTY | PointcutTargetType.SET_PROPERTY,
    X
  > {
    compiledSymbol = {
      ...compiledSymbol,
      set(...args: any[]) {
        return joinpoint(this, ...args);
      },
    };
    delete compiledSymbol.value;
    delete compiledSymbol.writable;
    return compiledSymbol;
  }
  override compile(
    ctxt: MutableAdviceContext<
      PointcutTargetType.GET_PROPERTY | PointcutTargetType.SET_PROPERTY,
      X
    >,
    selection: AdvicesSelection,
  ): CompiledSymbol<
    PointcutTargetType.GET_PROPERTY | PointcutTargetType.SET_PROPERTY,
    X
  > {
    // leave descriptor as compiler by getter strategy
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
        this.createPropertyDescriptor(ctxt.target.propertyKey),
      true,
    );

    //  if no prop advices, return descriptor as is
    if (selection.find().next().done) {
      return oldDescriptor;
    }

    const conpileAdviceEntries = [
      ...selection.find(PointcutTargetType.GET_PROPERTY, PointcutType.COMPILE),
      ...selection.find(PointcutTargetType.SET_PROPERTY, PointcutType.COMPILE),
    ];

    const newDescriptor: PropertyDescriptor =
      conpileAdviceEntries
        .map((entry) => {
          assert(typeof entry === 'function');
          // TODO: do not call all @Compile advices. Only the one with highest precedence
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

  private createPropertyDescriptor(propertyName: string): PropertyDescriptor {
    const surrogate = { [propertyName]: '' };
    const surrogateDescriptor = Reflect.getOwnPropertyDescriptor(
      surrogate,
      propertyName,
    )!;

    return surrogateDescriptor;
  }
}
