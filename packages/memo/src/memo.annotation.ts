import { AnnotationFactory, AnnotationRef } from '@aspectjs/core';
import { MemoAspectOptions } from './memo.aspect';
import { MemoDriver } from './drivers/memo.driver';
const af = new AnnotationFactory('aspectjs');

// TODO remove when https://github.com/microsoft/rushstack/issues/1050 is resolved
AnnotationRef;
export const Memo = af.create(function Memo(options?: MemoOptions): MethodDecorator {
    return;
});

export interface MemoOptions extends MemoAspectOptions {
    driver?: string | typeof MemoDriver;
}
