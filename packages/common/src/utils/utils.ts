export function isFunction(
  value: unknown
): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

export function isObject(value: unknown): value is object {
  return typeof value === 'object' && !(value instanceof Array);
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

export function isEmpty(value: unknown[]): boolean {
  return value.length === 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPromise(obj: any): obj is Promise<unknown> {
  return isFunction(obj?.then);
}
