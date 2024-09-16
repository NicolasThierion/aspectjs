import { getMetadata } from '@aspectjs/common/utils';

import { Around, AroundContext, Aspect, JoinPoint, on } from '@aspectjs/core';
import hash from '@emotion/hash';
import stringify from 'json-stable-stringify';
import { uid } from 'uid';
import { Memo } from './memo.annotation';
interface MemoEntry {
  value: unknown;
  uid: string;
}

/**
 * Aspect that enables memoization of method results.
 *
 * The MemoAspect is an aspect that can be applied using the `@Memo` annotation to enable
 *              memoization of method results. When a method is marked with `@Memo`, the aspect will
 *              cache the returned value of the method based on the method arguments. Subsequent calls
 *              to the method with the same arguments will return the cached result quickly instead of
 *              executing the method again.
 *
 * @remarks
 * This aspect requires the use of the `@aspectjs/core` package.
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
@Aspect('memo')
export class MemoAspect {
  private uid = uid();

  /**
   * @internal
   * @param ctxt - The context object for the around advice.
   * @param jp - The join point representing the intercepted method.
   * @param args - The arguments passed to the intercepted method.
   * @returns The result of the intercepted method, either from the cache or by executing the method.
   */
  @Around(on.any.withAnnotations(Memo))
  memoize(ctxt: AroundContext, jp: JoinPoint, args: unknown[]) {
    const entry = this.getEntry(ctxt);

    if (entry) {
      if (this.uid === entry.uid) {
        return entry.value;
      }
    }

    const newEntry: MemoEntry = {
      value: jp(...args),
      uid: this.uid,
    };

    this.setEntry(ctxt, newEntry);

    return newEntry.value;
  }

  /**
   * Clears the memoization cache.
   * This method resets the unique identifier used for memoization, causing subsequent method calls
   * to be treated as new calls and re-executed.
   */
  clear() {
    this.uid = uid();
  }

  private setEntry(ctxt: AroundContext, entry: MemoEntry) {
    const byPropertyMap = getMetadata(
      '@aspetjs:MemoAspect.cache',
      ctxt.instance,
      () => new Map<string, Map<string, MemoEntry>>(),
    );
    const key = this.getKey(ctxt);

    const byParametersMap =
      byPropertyMap.get(key) ?? new Map<string, MemoEntry>();
    byPropertyMap?.set(key, byParametersMap);

    byParametersMap?.set(this.getParametersSignature(ctxt), entry);
  }

  private getEntry(ctxt: AroundContext): MemoEntry | undefined {
    const byPropertyMap = getMetadata(
      '@aspetjs:MemoAspect.cache',
      ctxt.instance,
      () => new Map<string, Map<string, MemoEntry>>(),
    );
    const key = this.getKey(ctxt);
    const byParametersMap = byPropertyMap.get(key);

    return byParametersMap?.get(this.getParametersSignature(ctxt));
  }

  /**
   * @internal
   * @param ctxt - The context object for the around advice.
   * @returns The string signature representing the method arguments for memoization.
   */
  private getParametersSignature(ctxt: AroundContext): string {
    return hash(
      ctxt.args.map((a) => stringify(a)).reduce((a, b) => `${a}-${b}`, ''),
    );
  }

  /**
   * @internal
   * @param ctxt - The context object for the around advice.
   * @returns The key used to identify the method being memoized.
   */
  getKey(ctxt: AroundContext): string {
    return ctxt.target.ref.value;
  }
}
