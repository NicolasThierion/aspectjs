let __debug = false;

/**
 * @public
 */
export interface AspectOptions {
    id?: string;
}
/**
 * @public
 */
export type Mutable<T> = {
    -readonly [K in keyof T]: T[K];
};
const ASPECT_OPTIONS_REFLECT_KEY = 'aspectjs.aspect.options';
const ASPECT_ORIGINAL_CTOR_KEY = 'aspectjs.referenceConstructor';

/**
 * @public
 */
export function _getReferenceConstructor(proto: object & { constructor: { new (...args: unknown[]): unknown } }) {
    return Reflect.getOwnMetadata(ASPECT_ORIGINAL_CTOR_KEY, proto) ?? proto.constructor;
}

/**
 * @public
 */
export function _setReferenceConstructor<T>(proto: object, originalCtor: { new (...args: any[]): T }) {
    assert(isFunction(originalCtor));
    Reflect.defineMetadata(ASPECT_ORIGINAL_CTOR_KEY, originalCtor, proto);
}

/**
 * @public
 */
export function isAspect(aspect: object | Function) {
    return !!__getAspectOptions(aspect);
}

/**
 * @public
 */
export function assertIsAspect(aspect: object | Function) {
    if (!isAspect(aspect)) {
        const proto = getProto(aspect);
        throw new TypeError(`${proto.constructor.name} is not an Aspect`);
    }
}

function __getAspectOptions(aspect: object | Function): AspectOptions {
    if (!aspect) {
        return;
    }
    const proto = getProto(aspect);
    if (proto) {
        return Reflect.getOwnMetadata(ASPECT_OPTIONS_REFLECT_KEY, proto);
    }
}
/**
 * @public
 */
export function getAspectOptions(aspect: object | Function): AspectOptions {
    assertIsAspect(aspect);
    return __getAspectOptions(aspect);
}

/**
 * @public
 */
export function setAspectOptions(target: Function, options: AspectOptions): void {
    Reflect.defineMetadata(ASPECT_OPTIONS_REFLECT_KEY, options, getProto(target));
}

/**
 * @internal
 */
export function __setDebug(debug: boolean) {
    __debug = debug;
}

/**
 * @public
 */
export function assert(condition: boolean, errorProvider?: () => Error): void;

/**
 * @public
 */
export function assert(condition: boolean, msg?: string): void;

/**
 * @public
 */
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

/**
 * @public
 */
export function getOrComputeMetadata<T>(key: string, target: object, valueGenerator: () => T, save?: boolean): T;

/**
 * @public
 */
export function getOrComputeMetadata<T>(
    key: string,
    target: object,
    propertyKey: string,
    valueGenerator: () => T,
    save?: boolean,
): T;
export function getOrComputeMetadata<T>(
    key: string,
    target: object,
    propertyKey: string | (() => T),
    valueGenerator?: (() => T) | boolean,
    save = true,
): T {
    let _propertyKey = propertyKey as string;
    let _valueGenerator = valueGenerator as () => T;
    if (typeof valueGenerator === 'boolean') {
        save = valueGenerator;
    }
    if (typeof propertyKey === 'function') {
        _valueGenerator = propertyKey;
        _propertyKey = undefined;
    }

    assert(!!target);
    let value = Reflect.getOwnMetadata(key, target, _propertyKey);
    if (isUndefined(value)) {
        value = _valueGenerator();
        if (save) {
            Reflect.defineMetadata(key, value, target, _propertyKey);
        }
    }

    return value;
}

/**
 * @public
 */
export function getProto(
    target: Record<string, any> | Function,
): Record<string, any> & { constructor?: new (...args: any[]) => any } {
    if (isFunction(target)) {
        return target.prototype;
    } else if (target === null || target === undefined) {
        return target as any;
    }
    return target.hasOwnProperty('constructor') ? target : Object.getPrototypeOf(target);
}

/**
 * @public
 */
export function isObject(value: any): value is object {
    return typeof value === 'object' && !isArray(value);
}

/**
 * @public
 */
export function isArray(value: any): value is any[] {
    return !isUndefined(value) && value !== null && Object.getPrototypeOf(value) === Array.prototype;
}

/**
 * @public
 */
export function isString(value: any): value is string {
    return typeof value === 'string';
}

/**
 * @public
 */
export function isUndefined(value: any): value is undefined {
    return typeof value === 'undefined';
}

/**
 * @public
 */
export function isFunction(value: any): value is (...args: any[]) => any {
    return typeof value === 'function';
}

/**
 * @public
 */
export function isNumber(value: any): value is number {
    return typeof value === 'number';
}

/**
 * @public
 */
export function isEmpty(value: any): boolean {
    return value.length === 0;
}

/**
 * @public
 */
export function isPromise(obj: any): obj is Promise<any> {
    return isFunction(obj?.then);
}
