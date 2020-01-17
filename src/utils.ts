export type Mutable<T> = {
    -readonly [K in keyof T]: T[K];
};

export function assert(condition: boolean, errorProvider?: () => Error): void;
export function assert(condition: boolean, msg?: string): void;
export function assert(condition: boolean, msg?: string | (() => Error)) {
    if (!condition) {
        const e = isFunction(msg) ? (msg as Function)() : new Error(msg ?? 'assertion error');
        const stack = e.stack.split('\n');
        stack.splice(1, 1);
        e.stack = stack.join('\n');

        throw e;
    }
}

export function getMetaOrDefault<T>(key: string, target: any, valueGenerator: () => T, save = true): T {
    let value = Reflect.getOwnMetadata(key, target);
    if (!value) {
        value = valueGenerator();
        if (save) {
            Reflect.defineMetadata(key, value, target);
        }
    }

    return value;
}

export function getOrDefault<U extends Record<string, any>, K extends keyof U>(
    obj: U,
    key: K,
    valueProvider: () => U[K],
    save?: boolean,
): U[K];
export function getOrDefault<T>(obj: any[], key: number, valueProvider: () => T, save?: boolean): T;
export function getOrDefault<T>(obj: any, key: string | number, valueProvider: () => T, save = true): T {
    assert(!!obj);
    const value = obj[key] ?? valueProvider();
    if (save) {
        obj[key] = value;
    }
    return value;
}

export function getProto(target: Record<string, any> | Function): Record<string, any> {
    if (isFunction(target)) {
        return target.prototype;
    }
    return target.hasOwnProperty('constructor') ? target : Object.getPrototypeOf(target);
}

export function isObject(value: any): value is object {
    return typeof value === 'object' && !isArray(value);
}

export function isArray(value: any): value is any[] {
    return !isUndefined(value) && Object.getPrototypeOf(value) === Array.prototype;
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
