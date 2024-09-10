import { assert, defineMetadata, getMetadata } from '@aspectjs/common/utils';

import { PointcutType } from '../../pointcut/pointcut-target.type';
import { JitWeaverCanvasStrategy } from './jit-canvas.strategy';

import { PropertyAnnotationTarget } from '@aspectjs/common';
import { AdviceType } from '../../advice/advice-type.type';
import { JoinPoint } from '../../advice/joinpoint';
import { MutableAdviceContext } from '../../advice/mutable-advice.context';
import { AdviceEntry } from '../../advice/registry/advice-entry.model';
import { AdvicesSelection } from '../../advice/registry/advices-selection.model';
import { AdviceError } from '../../errors/advice.error';
import { CompiledSymbol } from '../../weaver/canvas/canvas-strategy.type';
import type { WeaverContext } from '../../weaver/context/weaver.context';
import { CompiledCanvas, JitWeaverCanvas } from './jit-canvas.type';
/**
 * Canvas to advise property getters and setters
 */
export class JitPropertyCanvasStrategy<
  X = unknown,
> extends JitWeaverCanvasStrategy<
  PointcutType.GET_PROPERTY | PointcutType.SET_PROPERTY,
  X
> {
  private propertySetterStrategy: JitPropertySetCanvasStrategy<X>;
  propertySetterCanvas?: CompiledCanvas<
    PointcutType.GET_PROPERTY | PointcutType.SET_PROPERTY,
    X
  >;

  constructor(weaverContext: WeaverContext, advices: AdvicesSelection) {
    super(weaverContext, advices, [PointcutType.GET_PROPERTY]);
    this.propertySetterStrategy = this.createPropertySetterStrategy();
  }

  compile(
    ctxt: MutableAdviceContext<
      PointcutType.GET_PROPERTY | PointcutType.SET_PROPERTY,
      X
    >,
  ): PropertyDescriptor | undefined {
    this.propertySetterCanvas = new JitWeaverCanvas(
      this.propertySetterStrategy,
    ).compile(new MutableAdviceContext<any, any>(ctxt));

    return this.propertySetterCanvas.compiledSymbol!;
  }

  override callJoinpoint(
    ctxt: MutableAdviceContext<
      PointcutType.GET_PROPERTY | PointcutType.SET_PROPERTY,
      X
    >,
    originalSymbol: PropertyDescriptor,
  ): unknown {
    assert(!!ctxt.args);

    assert(
      this.pointcutTypes.includes(PointcutType.GET_PROPERTY) ||
        this.pointcutTypes.includes(PointcutType.SET_PROPERTY),
    );
    assert(!ctxt.args?.length);
    ctxt.value = originalSymbol.get
      ? originalSymbol.get.apply(ctxt.instance)
      : originalSymbol.value;
    return ctxt.value;
  }

  override link(
    ctxt: MutableAdviceContext<
      PointcutType.GET_PROPERTY | PointcutType.SET_PROPERTY,
      X
    >,
    compiledSymbol: CompiledSymbol<
      PointcutType.GET_PROPERTY | PointcutType.SET_PROPERTY,
      X
    >,
    getterJoinpoint: (...args: any[]) => unknown,
  ): PropertyDescriptor {
    assert(!!ctxt.target?.proto);

    const configurable = getMetadata(
      '@aspectjs:configurable',
      compiledSymbol,
    ) as boolean;
    compiledSymbol = {
      ...compiledSymbol,
      get() {
        return getterJoinpoint(this);
      },
      set: this.propertySetterCanvas!.link()!.set,
    };

    delete compiledSymbol.value;
    delete compiledSymbol.writable;
    compiledSymbol.configurable = configurable;

    return compiledSymbol;
  }

  private createPropertySetterStrategy() {
    return new JitPropertySetCanvasStrategy(this.weaverContext, this.advices);
  }
}

class JitPropertySetCanvasStrategy<X> extends JitWeaverCanvasStrategy<
  PointcutType.GET_PROPERTY | PointcutType.SET_PROPERTY,
  X
> {
  constructor(weaverContext: WeaverContext, advices: AdvicesSelection) {
    super(weaverContext, advices, [PointcutType.SET_PROPERTY]);
  }

  override callJoinpoint(
    ctxt: MutableAdviceContext<
      PointcutType.GET_PROPERTY | PointcutType.SET_PROPERTY,
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
      PointcutType.GET_PROPERTY | PointcutType.SET_PROPERTY,
      X
    >,
    compiledSymbol: PropertyDescriptor,
    joinpoint: JoinPoint,
  ): CompiledSymbol<PointcutType.GET_PROPERTY | PointcutType.SET_PROPERTY, X> {
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
      PointcutType.GET_PROPERTY | PointcutType.SET_PROPERTY,
      X
    >,
  ): CompiledSymbol<PointcutType.GET_PROPERTY | PointcutType.SET_PROPERTY, X> {
    // if property already compiled, it might also be linked.
    // Use the last known compiled symbol as a reference to avoid linking twice.
    let propertyDescriptor = ctxt.target.getMetadata(
      '@ajs:compiledSymbol',
      () =>
        ctxt.target.descriptor ?? this.createPropertyDescriptor(ctxt.target),
    );

    assert(!!ctxt.target.propertyKey);
    const target = ctxt.target;

    const findCompileAdvices = () => {
      return [
        ...new Set([
          ...this.advices.find(
            [PointcutType.GET_PROPERTY],
            [AdviceType.COMPILE],
          ),
          ...this.advices.find(
            [PointcutType.SET_PROPERTY],
            [AdviceType.COMPILE],
          ),
        ]),
      ];
    };

    const applyCompileAdvices = () => {
      adviceEntries
        //  prevent calling them twice.
        .filter(
          (e) =>
            !getMetadata(
              `ajs.compiled`,
              e.advice,
              ctxt.target.ref.value,
              () => false,
            ),
        )
        .forEach((entry) => {
          try {
            defineMetadata(
              `ajs.compiled`,
              true,
              entry.advice,
              ctxt.target.ref.value,
            );

            assert(typeof entry.advice === 'function');
            const descriptor = entry.advice.call(
              entry.aspect,
              ctxt.asCompileContext(),
            );

            if (descriptor) {
              if (typeof descriptor !== 'object') {
                throw new AdviceError(
                  entry.aspect,
                  entry.advice,
                  ctxt.target,
                  'should return void or a property descriptor',
                );
              }

              if (propertyDescriptor.configurable === false) {
                throw new AdviceError(
                  entry.aspect,
                  entry.advice,
                  ctxt.target,
                  `${target.label} is not configurable`,
                );
              }
              propertyDescriptor = this.normalizeDescriptor(descriptor);
              Reflect.defineProperty(
                ctxt.target.proto,
                ctxt.target.propertyKey,
                propertyDescriptor,
              );
            }

            return descriptor;
          } catch (e) {
            defineMetadata(
              `ajs.compiled`,
              false,
              entry.advice,
              ctxt.target.ref.value,
            );
            throw e;
          }
        });
    };

    // an advice be a mixin compile advice, that in turn add new annotations & their new corresponding advices.
    // apply compile advices until state got stable
    let previousAdviceEntries: AdviceEntry[] = [];
    let adviceEntries = findCompileAdvices();

    while (adviceEntries.length !== previousAdviceEntries.length) {
      previousAdviceEntries = adviceEntries;
      applyCompileAdvices();
      adviceEntries = findCompileAdvices();
    }

    return propertyDescriptor;
  }

  override afterThrow(
    ctxt: MutableAdviceContext<PointcutType.SET_PROPERTY, X>,
  ) {
    return super.afterThrow(ctxt, false);
  }
  override around(ctxt: MutableAdviceContext<PointcutType.SET_PROPERTY, X>) {
    return super.around(ctxt, false);
  }

  private normalizeDescriptor(descriptor: PropertyDescriptor): any {
    // test property validity
    const surrogate = { prop: undefined };
    const surrogateProp = Reflect.getOwnPropertyDescriptor(surrogate, 'prop')!;
    descriptor.enumerable ??= surrogateProp.enumerable;

    Object.defineProperty(surrogate, 'newProp', descriptor);

    // normalize the descriptor
    descriptor = Object.getOwnPropertyDescriptor(surrogate, 'newProp')!;

    // descriptor should be configurable to later link the canvas.
    // move the configurable attribute so the canvas can restore it later
    defineMetadata(
      '@aspectjs:configurable',
      descriptor.configurable,
      descriptor,
    );
    descriptor.configurable = true;

    return descriptor;
  }

  private createPropertyDescriptor(
    target: PropertyAnnotationTarget,
  ): PropertyDescriptor {
    const { propertyKey } = target;
    const surrogate = { [propertyKey]: undefined };
    const surrogateDescriptor = Reflect.getOwnPropertyDescriptor(
      surrogate,
      propertyKey,
    )!;

    return surrogateDescriptor;
  }
}
