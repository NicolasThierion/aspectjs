import { assert, ConstructorType, getMetadata } from '@aspectjs/common/utils';
import { AdviceEntry } from './../../advice/registry/advice-entry.model';

import { PointcutTargetType } from './../../pointcut/pointcut-target.type';
import { JitWeaverCanvasStrategy } from './jit-canvas.strategy';

import { AdviceType } from '../../advice/advice.type';
import type { AdvicesSelection } from '../../advice/registry/advices-selection.model';
import { CompiledSymbol } from '../../weaver/canvas/canvas-strategy.type';
import type { WeaverContext } from '../../weaver/context/weaver.context';
import { MutableAdviceContext } from './../../advice/mutable-advice.context';
import { renameFunction } from './canvas.utils';

/**
 * Canvas to advise classes
 */
export class JitClassCanvasStrategy<
  X = unknown,
> extends JitWeaverCanvasStrategy<PointcutTargetType.CLASS, X> {
  constructor(weaverContext: WeaverContext) {
    super(weaverContext, PointcutTargetType.CLASS);
  }

  compile(
    ctxt: MutableAdviceContext<PointcutTargetType.CLASS, X>,
    selection: AdvicesSelection,
  ): ConstructorType<X> {
    //  if no class compile advices, return ctor as is
    const adviceEntries = [
      ...selection.find(PointcutTargetType.CLASS, AdviceType.COMPILE),
    ];

    // if another @Compile advice has been applied
    // replace wrapped ctor by original ctor before it gets wrapped again
    let constructor = getMetadata(
      '@aspectjs:jitClassCanvas',
      ctxt.target.proto,
      () => ctxt.target.proto.constructor,
      true,
    ) as ConstructorType<X>;

    if (!adviceEntries.length) {
      return constructor;
    }

    adviceEntries.forEach((entry) => {
      assert(typeof entry === 'function');
      constructor = (entry.advice.call(entry.aspect, ctxt.asCompileContext()) ??
        constructor) as ConstructorType<X>;
    });
    return constructor;
  }

  override before(
    ctxt: MutableAdviceContext<PointcutTargetType.CLASS, X>,
    selection: AdvicesSelection,
  ): void {
    super.before(withNullInstance(ctxt), selection);
  }

  // override around(
  //   ctxt: MutableAdviceContext<PointcutTargetType.CLASS, X>,
  //   selection: AdvicesSelection,
  // ): JoinPoint {
  //   const jp = super.around(withNullInstance(ctxt), selection);

  // }

  override callJoinpoint(
    ctxt: MutableAdviceContext<PointcutTargetType.CLASS, X>,
    originalSymbol: ConstructorType<X>,
  ): unknown {
    assert(!!ctxt.args);
    assert(!!ctxt.instance);
    const newInstance = new originalSymbol(...ctxt.args!);
    Object.assign(ctxt.instance as any, newInstance);
    return (ctxt.value = ctxt.instance);
  }

  override link(
    ctxt: MutableAdviceContext<PointcutTargetType.CLASS, X>,
    compiledConstructor: CompiledSymbol<PointcutTargetType.CLASS, X>,
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
    adviceEntry: AdviceEntry<PointcutTargetType.CLASS>,
    ctxt: MutableAdviceContext<PointcutTargetType.CLASS>,
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
  ctxt: MutableAdviceContext<PointcutTargetType.CLASS, X>,
): MutableAdviceContext<PointcutTargetType.CLASS, X> {
  return new MutableAdviceContext<PointcutTargetType.CLASS, X>({
    ...ctxt,
    instance: null,
  });
}
