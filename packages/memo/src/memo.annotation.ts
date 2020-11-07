import { AnnotationRef } from '@aspectjs/core/types';
import { MemoAspectOptions } from './memo.aspect';
import { MemoDriver } from './drivers';
import { ASPECTJS_ANNOTATION_FACTORY } from '@aspectjs/core/utils';

// TODO remove when https://github.com/microsoft/rushstack/issues/1050 is resolved
AnnotationRef;
export const Memo = ASPECTJS_ANNOTATION_FACTORY.create(function Memo(options?: MemoOptions): MethodDecorator {
    return;
});

export interface MemoOptions extends MemoAspectOptions {
    driver?: string | typeof MemoDriver;
}
