/**
 * Hold the original function,
 * bound to its execution context and it original parameters.
 * - Call this method without parameters to call the original function without parameters.
 * - Call this method with an new parameters to call the original function with the given parameters.
 *
 * In any way, calling a joinpoint twice will throw a WeavingError
 */
export type JoinPoint<T = unknown> = (...args: unknown[]) => T;
