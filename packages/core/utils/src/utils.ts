let __debug = false;
export function __setDebug(debug: boolean) {
    __debug = debug;
}

export function assert(condition: boolean, errorProvider?: () => Error): void;
export function assert(condition: boolean, msg?: string): void;
export function assert(condition: boolean, msg?: string | (() => Error)) {
    if (__debug && !condition) {
        debugger;
        const e = isFunction(msg) ? (msg as Function)() : new Error(msg ?? 'assertion error');
        const stack = e.stack.split('\n');
        stack.splice(1, 1);
        e.stack = stack.join('\n');

        throw e;
    }
}

export function getOrComputeMetadata<T>(
    key: string,
    target: any,
    valueGenerator: () => T,
    save = true,
    propertyKey?: string,
): T {
    let value = Reflect.getOwnMetadata(key, target, propertyKey);
    if (isUndefined(value)) {
        value = valueGenerator();
        if (save) {
            Reflect.defineMetadata(key, value, target, propertyKey);
        }
    }

    return value;
}

export function getProto(target: Record<string, any> | Function): Record<string, any> {
    if (isFunction(target)) {
        return target.prototype;
    } else if (target === null || target === undefined) {
        return target;
    }
    return target.hasOwnProperty('constructor') ? target : Object.getPrototypeOf(target);
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

export function isFunction(value: any): value is (...args: any[]) => any {
    return typeof value === 'function';
}

export function isNumber(value: any): value is number {
    return typeof value === 'number';
}

export function isEmpty(value: any): boolean {
    return value.length === 0;
}

export function clone<T>(obj: T): T {
    return { ...obj };
}

export function isPromise(obj: any): obj is Promise<any> {
    return isFunction(obj?.then);
}

export function provider<T, A>(arg: T | ((a: A) => T)): (a?: A) => T {
    return isFunction(arg) ? arg : () => arg;
}
