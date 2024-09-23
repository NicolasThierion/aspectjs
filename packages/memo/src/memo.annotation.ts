/* eslint-disable @typescript-eslint/no-unused-vars */
import { memoAnnotationFactory } from './memo-annotation-factory';

export interface MemoOptions {
  expires?: number | Date;
}

/**
 * Annotation to declare a method as memoizable.
 *
 * The `@Memo` annotation is used to mark a method as memoizable, meaning its return value will be cached
 * and subsequent calls to the method with the same arguments will return the cached result quickly
 * instead of executing the method again.
 * The memoization occurs when the {@link MemoAspect} aspect is enabled.
 *
 * @example
 * ```typescript
 * import { Memo } from '@aspectjs/core';
 *
 * class MyClass {
 *   @Memo()
 *   expensiveCalculation(arg1: string, arg2: number): string {
 *     // Perform expensive calculation
 *     return result;
 *   }
 * }
 * ```
 */
export const Memo = memoAnnotationFactory.create(
  'Memo',
  function (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line
    options?: MemoOptions,
  ) {},
);
