import { isFunction } from './utils';

let __debug = false;

export function setDebug(debug: boolean) {
  __debug = debug;
}

export function isDebug() {
  return __debug;
}

export function assert(condition: boolean, errorProvider?: () => Error): void;
export function assert(
  condition: () => boolean,
  errorProvider?: () => Error,
): void;
export function assert(condition: boolean, msg?: string): void;
export function assert(condition: true, msg?: string): void;
export function assert(condition: false, msg?: string): never;
export function assert(
  condition: boolean | (() => boolean),
  msg?: string | (() => Error),
) {
  if (__debug) {
    const conditionValue =
      typeof condition === 'function' ? condition() : condition;

    if (!conditionValue) {
      /* eslint-disable no-debugger */
      debugger;
      const e = isFunction(msg) ? msg() : new Error(msg ?? 'assertion error');
      const stack = e.stack?.split('\n') ?? [];
      stack.splice(1, 1);
      e.stack = stack.join('\n');

      throw e;
    }
  }
}
