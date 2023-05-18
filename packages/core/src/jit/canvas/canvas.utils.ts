import { ConstructorType, assert } from '@aspectjs/common/utils';

/**
 *
 * @param fn
 * @param nameOrStub
 * @param tag
 * @param toString
 * @internal
 */
export function renameFunction<T, F extends (...args: any[]) => T>(
  fn: F,
  nameOrStub: string | ((...args: any[]) => unknown) | ConstructorType,
  tag?: string,
  toString?: () => string,
): F {
  assert(typeof fn === 'function');

  const name = typeof nameOrStub === 'string' ? nameOrStub : nameOrStub.name;
  const args =
    typeof nameOrStub === 'string' ? '...args' : getParamNames(nameOrStub);
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
      `return function ${name}(${args}) { return fn.call(${['this', args].join(
        ', ',
      )}) };`,
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

// JavaScript program to get the function
// name/values dynamically
function getParamNames(fn: ((...args: any[]) => any) | ConstructorType) {
  // Remove comments of the form /* ... */
  // Removing comments of the form //
  // Remove body of the function { ... }
  // removing '=>' if func is arrow function
  const str = fn
    .toString()
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/(.)*/g, '')
    .replace(/{[\s\S]*}/, '')
    .replace(/=>/g, '')
    .trim();

  // Start parameter names after first '('
  const start = str.indexOf('(') + 1;

  // End parameter names is just before last ')'
  const end = str.length - 1;

  return str.substring(start, end);
}
