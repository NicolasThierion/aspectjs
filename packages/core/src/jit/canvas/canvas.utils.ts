import { assert } from '@aspectjs/common/utils';

/**
 *
 * @param fn
 * @param name
 * @param tag
 * @param toString
 * @internal
 */
export function renameFunction<T, F extends (...args: any[]) => T>(
  fn: F,
  name: string,
  tag?: string,
  toString?: () => string,
): F {
  assert(typeof fn === 'function');

  // const map = new Map<string, F>();
  // map.set(name, function (...args: any[]) {
  //   fn(null, ...args);
  // } as F);
  // const newFn = map.get(name)!;
  let newFn: F = function (this: any, ...args: any[]) {
    return fn(this, ...args);
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

  if (toString) {
    // newFn.prototype.toString = toString;
    newFn.toString = toString;
  }
  return newFn;
}
