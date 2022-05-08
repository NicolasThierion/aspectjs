export function getPrototype(
  target: Record<string, any> | Function,
): Record<string, any> & { constructor?: new (...args: any[]) => any } {
  if (isFunction(target)) {
    return target.prototype;
  } else if (target === null || target === undefined) {
    return target as any;
  }
  return target.hasOwnProperty('constructor')
    ? target
    : Object.getPrototypeOf(target);
}

export function isFunction(
  value: unknown,
): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

export function isObject(value: unknown): value is object {
  return typeof value === 'object' && !(value instanceof Array);
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

export function isUndefined(value: unknown): value is undefined {
  return typeof value === 'undefined';
}

export function isEmpty(value: unknown[]): boolean {
  return value.length === 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPromise(obj: any): obj is Promise<unknown> {
  return isFunction(obj?.then);
}
