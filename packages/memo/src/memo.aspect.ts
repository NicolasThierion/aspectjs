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
@Aspect('memo')
export class MemoAspect {
  private uid = uid();

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

  getParametersSignature(ctxt: AroundContext): string {
    return hash(
      ctxt.args.map((a) => stringify(a)).reduce((a, b) => `${a}-${b}`, ''),
    );
  }

  getKey(ctxt: AroundContext): string {
    return ctxt.target.ref.value;
  }
}
