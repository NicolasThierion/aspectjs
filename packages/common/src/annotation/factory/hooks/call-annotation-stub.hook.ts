import type { AnnotationsHook } from '../annotations-hook';

export const CALL_ANNOTATION_STUB: AnnotationsHook = {
  name: '@aspectjs::hook:annotationStub',
  order: 0,
  decorator: (_annotation, annotationArgs, annotationStub) => {
    return annotationStub(...annotationArgs);
  },
};
