import { AnnotationFactory } from '../../annotation/factory/factory';

export const AClass = new AnnotationFactory('tests').create(function AClass(): ClassDecorator {
    return;
});
