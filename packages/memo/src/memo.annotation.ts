import { memoAnnotationFactory } from './memo-annotation-factory';

export interface MemoOptions {
  expires?: number | Date;
}

export const Memo = memoAnnotationFactory.create(function Memo(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options?: MemoOptions,
) {});
