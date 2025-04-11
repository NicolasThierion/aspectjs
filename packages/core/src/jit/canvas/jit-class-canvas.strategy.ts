import {
  _copyPropsAndMeta,
  assert,
  ConstructorType,
  defineMetadata,
  getMetadata,
} from '@aspectjs/common/utils';
import { AdviceEntry } from './../../advice/registry/advice-entry.model';

import { PointcutKind } from '../../pointcut/pointcut-kind.type';
import { JitWeaverCanvasStrategy } from './jit-canvas.strategy';

import { AdviceKind } from '../../advice/advice-type.type';
import type { AdvicesSelection } from '../../advice/registry/advices-selection.model';
import { AdviceError } from '../../errors/advice.error';
import { CompiledSymbol } from '../../weaver/canvas/canvas-strategy.type';
import type { WeaverContext } from '../../weaver/context/weaver.context';
import { MutableAdviceContext } from './../../advice/mutable-advice.context';
import { renameFunction } from './canvas.utils';

/**
 * Canvas to advise classes
 */
export class JitClassCanvasStrategy<
  X = unknown,
> extends JitWeaverCanvasStrategy<PointcutKind.CLASS, X> {
  constructor(weaverContext: WeaverContext, advices: AdvicesSelection) {
    super(weaverContext, advices, [PointcutKind.CLASS]);
  }

  compile(
    ctxt: MutableAdviceContext<PointcutKind.CLASS, X>,
  ): ConstructorType<X> {
    // if class already compiled, it might also be linked.
    // Use the last known compiled symbol as a reference to avoid linking twice.
    let constructor = ctxt.target.getMetadata(
      '@ajs:compiledSymbol',
      () => ctxt.target.proto.constructor,
    );

    const findCompileAdvices = () => {
      return [...this.advices.find([PointcutKind.CLASS], [AdviceKind.COMPILE])];
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
            ctxt.target.proto.constructor = constructor;

            const newConstructor = entry.advice.call(
              entry.aspect,
              ctxt.asCompileContext(),
            ) as ConstructorType<X>;

            if (newConstructor) {
              if (typeof newConstructor !== 'function') {
                throw new AdviceError(
                  entry.aspect,
                  entry.advice,
                  ctxt.target,
                  'should return void or a class constructor',
                );
              }

              _copyPropsAndMeta(newConstructor, constructor); // copy static props

              constructor = newConstructor;
            }
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

      ctxt.target.defineMetadata('@ajs:compiledSymbol', constructor);
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

    return constructor;
  }

  override before(ctxt: MutableAdviceContext<PointcutKind.CLASS, X>): void {
    super.before(withNullInstance(ctxt));
  }

  override callJoinpoint(
    ctxt: MutableAdviceContext<PointcutKind.CLASS, X>,
    originalSymbol: ConstructorType<X>,
  ): unknown {
    assert(!!ctxt.args);
    assert(!!ctxt.instance);
    const newInstance = Reflect.construct(originalSymbol, ctxt.args!);
    Object.assign(ctxt.instance as any, newInstance);
    return (ctxt.value = ctxt.instance);
  }

  override link(
    ctxt: MutableAdviceContext<PointcutKind.CLASS, X>,
    compiledConstructor: CompiledSymbol<PointcutKind.CLASS, X>,
    joinpoint: (...args: any[]) => unknown,
  ): ConstructorType<X> {
    assert(!!ctxt.target?.proto);

    const ctorName = compiledConstructor.name;

    joinpoint = renameFunction(
      joinpoint,
      compiledConstructor,
      `class ${ctorName}$$advised {}`,
      compiledConstructor.toString.bind(compiledConstructor),
    );

    // enhanced method / props may have put their own metadata.
    // iterate over enhanced properties & copy metadata from them.
    const enhancedPropertyKeys = [
      ...ctxt.target.declaringClass
        .getMetadata(
          '@ajs:weaver.enhanced-properties',
          () => new Set<string | symbol>(),
        )
        .values(),
    ];

    _copyPropsAndMeta(
      joinpoint,
      compiledConstructor as unknown as (...args: any[]) => any,
      enhancedPropertyKeys,
    ); // copy static props

    joinpoint.prototype = ctxt.target.proto;
    joinpoint.prototype.constructor = joinpoint;

    return joinpoint as any;
  }

  protected override callAdvice(
    adviceEntry: AdviceEntry<PointcutKind.CLASS>,
    ctxt: MutableAdviceContext<PointcutKind.CLASS>,
    args: unknown[],
    allowReturn = true,
  ): unknown {
    const val = super.callAdvice(adviceEntry, ctxt, args, allowReturn);

    if (val !== undefined) {
      ctxt.instance = val;
    }
    return (ctxt.value = ctxt.instance);
  }
}

/**
 * Void instance, as instance is not reliable before the actual call of the constructor
 */
function withNullInstance<X>(
  ctxt: MutableAdviceContext<PointcutKind.CLASS, X>,
): MutableAdviceContext<PointcutKind.CLASS, X> {
  return new MutableAdviceContext<PointcutKind.CLASS, X>({
    ...ctxt,
    instance: null,
  });
}
