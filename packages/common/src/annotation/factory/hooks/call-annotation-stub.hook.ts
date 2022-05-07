import type { AnnotationFactoryHook } from '../annotation-factory-hook.type';

export const CALL_ANNOTATION_STUB: AnnotationFactoryHook = {
  name: '@aspectjs::annotations.factory-hooks.annotationStub',
  order: 0,
  decorator: (_annotation, annotationArgs, annotationStub) => {
    return annotationStub(...annotationArgs);
  },
};
