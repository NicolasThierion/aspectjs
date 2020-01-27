import { AnnotationFactory } from '../../annotation/factory/factory';

const annotationFactory = new AnnotationFactory('aspectjs');

export const Aspect = annotationFactory.create(function Aspect(id?: string): ClassDecorator {
    return;
});
