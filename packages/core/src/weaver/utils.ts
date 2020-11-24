import { assert } from '@aspectjs/core/utils';

/**
 *
 * @param fn
 * @param name
 * @param tag
 * @param toString
 * @internal
 */
export function _defineFunctionProperties<T, F extends (...args: any[]) => T>(
    fn: F,
    name: string,
    tag: string,
    toString: () => string,
): F {
    assert(typeof fn === 'function');

    // const newFn = fn;
    const newFn = new Function('fn', `return function ${name}(...args) { return fn.apply(this, args) };`)(fn);
    Object.defineProperty(newFn, 'name', {
        value: name,
    });
    tag = tag ?? name;

    Object.defineProperty(newFn, Symbol.toPrimitive, {
        enumerable: false,
        configurable: true,
        value: () => tag,
    });

    newFn.prototype.toString = toString;
    newFn.toString = toString;
    return newFn;
}
