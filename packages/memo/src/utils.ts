export function provider<T, A>(arg: T | ((a: A) => T)): (a?: A) => T {
    return isFunction(arg) ? arg : () => arg;
}

export function isFunction(value: any): value is (...args: any[]) => any {
    return typeof value === 'function';
}

export function assert(condition: boolean, errorProvider?: () => Error): void;
export function assert(condition: boolean, msg?: string): void;
export function assert(condition: boolean, msg?: string | (() => Error)) {
    if (!condition) {
        debugger;
        const e = isFunction(msg) ? (msg as Function)() : new Error(msg ?? 'assertion error');
        const stack = e.stack.split('\n');
        stack.splice(1, 1);
        e.stack = stack.join('\n');

        throw e;
    }
}

export function isObject(value: any): value is object {
    return typeof value === 'object' && !isArray(value);
}

export function isArray(value: any): value is any[] {
    return !isUndefined(value) && value !== null && Object.getPrototypeOf(value) === Array.prototype;
}

export function isString(value: any): value is string {
    return typeof value === 'string';
}

export function isUndefined(value: any): value is undefined {
    return typeof value === 'undefined';
}

export function isNumber(value: any): value is number {
    return typeof value === 'number';
}

export function isEmpty(value: any): boolean {
    return value.length === 0;
}

export function getMetaOrDefault<T>(key: string, target: any, valueGenerator: () => T, save = true): T {
    let value = Reflect.getOwnMetadata(key, target);
    if (isUndefined(value)) {
        value = valueGenerator();
        if (save) {
            Reflect.defineMetadata(key, value, target);
        }
    }

    return value;
}
