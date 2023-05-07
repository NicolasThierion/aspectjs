import { assert, ConstructorType, getMetadata } from '@aspectjs/common/utils';

import { PointcutType } from './../../pointcut/pointcut-phase.type';
import { PointcutTargetType } from './../../pointcut/pointcut-target.type';
import { JitWeaverCanvasStrategy } from './jit-canvas.strategy';

import type { AdvicesSelection } from '../../advice/registry/advices-selection.model';
import { CompiledSymbol } from '../../weaver/canvas/canvas-strategy.type';
import type { WeaverContext } from '../../weaver/context/weaver.context';
import type { MutableAdviceContext } from './../../advice/advice.context';

/**
 * Canvas to advise classes
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
    const constructor = getMetadata(
      '@aspectjs:jitClassCanvas',
      ctxt.target.proto,
      'ref_ctor',
      () => ctxt.target.proto.constructor,
      true,
    );

    let ctor: ConstructorType<X> | undefined = undefined;

    adviceEntries.forEach((entry) => {
      assert(typeof entry === 'function');
      ctor = entry.advice.call(entry.aspect, ctxt.asCompileContext()) as any;
    });
    return ctor ?? constructor;
  }

  override before(
    ctxt: MutableAdviceContext<PointcutTargetType.CLASS, X>,
    selection: AdvicesSelection,
  ): void {
    // void instance, as instance is not reliable before the actuall call of the constructor
    const instanceSave = ctxt.instance;
    ctxt.instance = null;
    super.before(ctxt, selection);
    ctxt.instance = instanceSave;
  }

  override callJoinpoint(
    ctxt: MutableAdviceContext<PointcutTargetType.CLASS, X>,
    originalSymbol: ConstructorType<X>,
  ): void {
    assert(!!ctxt.args);
    assert(!!ctxt.instance);
    const origInstance = ctxt.instance;
    ctxt.instance = null;
    const newInstance = new originalSymbol(...ctxt.args!);
    Object.assign(origInstance as any, newInstance);
    ctxt.instance = ctxt.value = origInstance;
  }

  finalize(
    ctxt: MutableAdviceContext<PointcutTargetType.CLASS, X>,
    compiledSymbol: CompiledSymbol<PointcutTargetType.CLASS, X>,
    joinpoint: (...args: any[]) => unknown,
  ): ConstructorType<X> {
    assert(!!ctxt.target?.proto);
    const originalCtor = compiledSymbol;
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
function wrapConstructor<T, F extends (...args: any[]) => T>(
  fn: F,
  name: string,
  tag: string,
  toString: () => string,
): F {
  assert(typeof fn === 'function');

  // const map = new Map<string, F>();
  // map.set(name, function (...args: any[]) {
  //   fn(null, ...args);
  // } as F);
  // const newFn = map.get(name)!;
  let newFn: F = function (this: any, ...args: any[]) {
    const result = fn(this, ...args);
    console.log(result);
    return result;
  } as any;
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

  // newFn.prototype.toString = toString;
  newFn.toString = toString;
  return newFn;
}
