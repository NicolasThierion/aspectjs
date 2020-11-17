import { ASPECTJS_ANNOTATION_FACTORY, AnnotationRef } from '@aspectjs/core/commons';
import { MemoAspectOptions } from './memo.aspect';
import { MemoDriver } from './drivers';

// TODO remove when https://github.com/microsoft/rushstack/issues/1050 is resolved
AnnotationRef;

/**
 * Memoize the return value of a method. The return value can be sored in LocalStorage or in IndexedDb according to configured drivers.
 * @see MEMO_PROFILE
 * @public
 */
export const Memo = ASPECTJS_ANNOTATION_FACTORY.create(function Memo(options?: MemoOptions): MethodDecorator {
    return;
});

/**
 * Options supported by the @Memo annotation
 * @public
 */
export interface MemoOptions extends MemoAspectOptions {
    driver?: string | typeof MemoDriver;
}
