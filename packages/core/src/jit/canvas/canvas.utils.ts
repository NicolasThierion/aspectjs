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
    typeof nameOrStub === 'string' ? ['...args'] : getParamNames(nameOrStub);

  let newFn: F = function (this: any, ...args: any[]) {
    return fn(this, ...args);
  } as any;
  try {
    // try to rename thr function.
    const renamedNewFn = new Function(
      'fn',
      `return function ${name}(${args}) { return fn.apply(${['this']
        // `return function ${name}(${args}) { return fn.call(${['this']
        // .concat(args)
        .concat('arguments')
        .join(', ')}) };`,
    )(newFn);
    renamedNewFn.prototype = newFn.prototype;
    newFn = renamedNewFn;
  } catch (e) {
    assert(false);
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
function getParamNames(
  fn: ((...args: any[]) => any) | ConstructorType,
): string[] {
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

  const classMatch = str.match(/class .+/);

  const args = classMatch
    ? fn
        .toString()
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/(.)*/g, '')
        .match(/.*constructor\((?<args>.*?)\).*/)
        ?.groups!['args']?.split(',') ?? []
    : str.match(/(\((?<args>.*?)\).*)/)?.groups!['args']?.split(',') ?? [];

  return args.map((arg) => arg.split('=')).map(([n]) => n!.trim());
}
