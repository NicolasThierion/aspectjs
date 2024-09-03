import {
  _copyPropsAndMeta,
  assert,
  ConstructorType,
} from '@aspectjs/common/utils';
import { AdviceEntry } from './../../advice/registry/advice-entry.model';

import { PointcutType } from './../../pointcut/pointcut-target.type';
import { JitWeaverCanvasStrategy } from './jit-canvas.strategy';

import { AdviceType } from '../../advice/advice-type.type';
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
> extends JitWeaverCanvasStrategy<PointcutType.CLASS, X> {
  constructor(weaverContext: WeaverContext) {
    super(weaverContext, [PointcutType.CLASS]);
  }

  compile(
    ctxt: MutableAdviceContext<PointcutType.CLASS, X>,
    selection: AdvicesSelection,
  ): ConstructorType<X> {
    // if class already compiled, it might also be linked.
    // Use the last known compiled symbol as a reference to avoid linking twice.
    let constructor = ctxt.target.getMetadata(
      '@ajs:compiledSymbol',
      () => ctxt.target.proto.constructor,
    ) as ConstructorType<X>;

    const adviceEntries = [
      ...selection.find([PointcutType.CLASS], [AdviceType.COMPILE]),
    ];
    //  if no class compile advices, return ctor as is
    if (!adviceEntries.length) {
      return constructor;
    }

    adviceEntries
      //  prevent calling them twice.
      .filter((e) => !ctxt.target.getMetadata(`compiled_${e.id}`, () => false))
      .forEach((entry) => {
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

        ctxt.target.defineMetadata(`compiled_${entry.id}`, true);
      });

    ctxt.target.defineMetadata('@ajs:compiledSymbol', constructor);
    return constructor;
  }

  override before(
    ctxt: MutableAdviceContext<PointcutType.CLASS, X>,
    selection: AdvicesSelection,
  ): void {
    super.before(withNullInstance(ctxt), selection);
  }

  override callJoinpoint(
    ctxt: MutableAdviceContext<PointcutType.CLASS, X>,
    originalSymbol: ConstructorType<X>,
  ): unknown {
    assert(!!ctxt.args);
    assert(!!ctxt.instance);
    const newInstance = Reflect.construct(originalSymbol, ctxt.args!);
    Object.assign(ctxt.instance as any, newInstance);
    return (ctxt.value = ctxt.instance);
  }

  override link(
    ctxt: MutableAdviceContext<PointcutType.CLASS, X>,
    compiledConstructor: CompiledSymbol<PointcutType.CLASS, X>,
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
    joinpoint.prototype = ctxt.target.proto;
    joinpoint.prototype.constructor = joinpoint;

    return joinpoint as any;
  }

  protected override callAdvice(
    adviceEntry: AdviceEntry<PointcutType.CLASS>,
    ctxt: MutableAdviceContext<PointcutType.CLASS>,
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
  ctxt: MutableAdviceContext<PointcutType.CLASS, X>,
): MutableAdviceContext<PointcutType.CLASS, X> {
  return new MutableAdviceContext<PointcutType.CLASS, X>({
    ...ctxt,
    instance: null,
  });
}
