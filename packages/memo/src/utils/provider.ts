import { isFunction } from '@aspectjs/core/utils';

export function provider<T, A>(arg: T | ((a: A) => T)): (a?: A) => T {
    return isFunction(arg) ? arg : () => arg;
}
