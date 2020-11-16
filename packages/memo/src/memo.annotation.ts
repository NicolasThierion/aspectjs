import { ASPECTJS_ANNOTATION_FACTORY, AnnotationRef } from '@aspectjs/core/commons';
import { MemoAspectOptions } from './memo.aspect';
import { MemoDriver } from './drivers';

// TODO remove when https://github.com/microsoft/rushstack/issues/1050 is resolved
AnnotationRef;
export const Memo = ASPECTJS_ANNOTATION_FACTORY.create(function Memo(options?: MemoOptions): MethodDecorator {
    return;
});

export interface MemoOptions extends MemoAspectOptions {
    driver?: string | typeof MemoDriver;
}
