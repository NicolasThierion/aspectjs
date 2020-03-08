export function provider<T, A>(arg: T | ((a: A) => T)): (a?: A) => T {
    return isFunction(arg) ? arg : () => arg;
}

export function isFunction(value: any): value is (...args: any[]) => any {
    return typeof value === 'function';
}
