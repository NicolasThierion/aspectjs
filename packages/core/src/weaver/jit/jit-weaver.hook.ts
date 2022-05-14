import type {
  Annotation,
  AnnotationFactoryHook,
  AnnotationStub,
  AnnotationType,
} from '@aspectjs/common';

export const CALL_JIT_WEAVER_HOOK = (): AnnotationFactoryHook => {
  return {
    name: 'CALL_JIT_WEAVER_HOOK',

    decorator: function (
      annotation: Annotation<AnnotationType, AnnotationStub<AnnotationType>>,
      annotationArgs: unknown[],
      annotationStub: AnnotationStub<AnnotationType>,
    ): void {
      throw new Error('Function not implemented.');
    },
  };
};
