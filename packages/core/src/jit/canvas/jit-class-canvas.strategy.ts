import { assert, ConstructorType, getMetadata } from '@aspectjs/common/utils';

import { PointcutType } from './../../pointcut/pointcut-phase.type';
import { PointcutTargetType } from './../../pointcut/pointcut-target.type';
import { JitWeaverCanvasStrategy } from './jit-canvas.strategy';

import type { AdvicesSelection } from '../../advice/registry/advices-selection.model';
import type { WeaverContext } from '../../weaver/context/weaver.context';
import type { MutableAdviceContext } from './../../advice/advice.context';

/**
 * Canvas to weave classes
 */
export class JitClassCanvas<X = unknown> extends JitWeaverCanvasStrategy<
  PointcutTargetType.CLASS,
  X
> {
  constructor(weaverContext: WeaverContext) {
    super(PointcutTargetType.CLASS, weaverContext);
  }

  compile(
    ctxt: MutableAdviceContext<PointcutTargetType.CLASS, X>,
    selection: AdvicesSelection,
  ): ConstructorType<X> {
    //  if no class compile advices, return ctor as is
    const adviceEntries = [
      ...selection.find(PointcutTargetType.CLASS, PointcutType.COMPILE),
    ];

    if (!adviceEntries.length) {
      return ctxt.target.proto.constructor;
    }

    // if another @Compile advice has been applied
    // replace wrapped ctor by original ctor before it gets wrapped again
    ctxt.target.proto.constructor = getMetadata(
      '@aspectjs:jitClassCanvas',
      ctxt.target.proto,
      'ref_ctor',
      () => ctxt.target.proto.constructor,
    );

    let ctor: ConstructorType<X> | undefined = undefined;

    adviceEntries.forEach((entry) => {
      assert(typeof entry === 'function');
      ctor = entry.advice.call(entry.aspect, ctxt.asCompileContext()) as any;
    });
    return (ctxt.target.proto.constructor =
      ctor ?? ctxt.target.proto.constructor);
  }

  override callJoinpoint(
    ctxt: MutableAdviceContext<PointcutTargetType.CLASS, X>,
    originalSymbol: ConstructorType<X>,
  ): void {
    assert(!!ctxt.args);
    ctxt.instance = ctxt.value = new originalSymbol(...ctxt.args!);
  }

  finalize(
    ctxt: MutableAdviceContext<PointcutTargetType.CLASS, X>,
    joinpoint: (...args: any[]) => unknown,
  ): ConstructorType<X> {
    assert(!!ctxt.target?.proto);
    const originalCtor = ctxt.target.proto.constructor;
    const ctorName = originalCtor.name;

    joinpoint = wrapConstructor(
      joinpoint,
      ctorName,
      `class ${ctorName}$$advised {}`,
      originalCtor.toString.bind(originalCtor),
    );
    joinpoint.prototype = ctxt.target.proto;
    joinpoint.prototype.constructor = joinpoint;

    return joinpoint as any;
  }
}

/**
 *
 * @param fn
 * @param name
 * @param tag
 * @param toString
 * @internal
 */
export function wrapConstructor<T, F extends (...args: any[]) => T>(
  fn: F,
  name: string,
  tag: string,
  toString: () => string,
): F {
  assert(typeof fn === 'function');

  let newFn: F = ((...args: any[]) => fn(null, ...args)) as any;
  try {
    // try to rename thr function.
    newFn = new Function(
      'fn',
      `return function ${name}(...args) { return fn.apply(this, args) };`,
    )(newFn);
  } catch (e) {
    // won't work if name is a keyword (eg: delete). Let newFn as is.
  }
  Object.defineProperty(newFn, 'name', {
    value: name,
  });
  tag = tag ?? name;

  Object.defineProperty(newFn, Symbol.toPrimitive, {
    enumerable: false,
    configurable: true,
    value: () => tag,
  });

  newFn.prototype.toString = toString;
  newFn.toString = toString;
  return newFn;
}
