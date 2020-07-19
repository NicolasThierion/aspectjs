import { AnnotationFactory } from '@aspectjs/core';
import { MemoAspectOptions } from './memo.aspect';
import { MemoDriver } from './drivers/memo.driver';

const af = new AnnotationFactory('aspectjs');
export const Memo = af.create(function Memo(options?: MemoOptions): MethodDecorator {
    return;
});

export interface MemoOptions extends MemoAspectOptions {
    driver?: string | typeof MemoDriver;
}
