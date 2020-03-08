import { AnnotationFactory } from '@aspectjs/core';

const af = new AnnotationFactory('aspectjs');

export const Memo = af.create(function Memo(options?: MemoOptions): MethodDecorator {
    return;
});

export interface MemoOptions {
    namespace?: string | (() => string);
    expiration?: Date | number | (() => Date | number);
}
