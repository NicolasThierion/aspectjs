import { AnnotationFactory } from '../../src/annotation/factory/factory';

const af = new AnnotationFactory('aspectjs');

export const Memo = af.create(function Memo(): MethodDecorator {
    return;
});
