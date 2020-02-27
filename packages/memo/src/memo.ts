import { AnnotationFactory } from '@aspectjs/core';

const af = new AnnotationFactory('aspectjs');

export const Memo = af.create(function Memo(): MethodDecorator {
    return;
});

export interface MemoOptions {
    namespace?: string;
}
