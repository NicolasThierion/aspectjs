import type {
  Annotation,
  AnnotationFactoryHook,
  AnnotationStub,
  AnnotationType,
} from '@aspectjs/common';
import { weaverContext } from '../context/weaver.context.global';

export const CALL_JIT_WEAVER_HOOK = (): AnnotationFactoryHook => {
  const weaver = weaverContext().get('Weaver');

  return {
    name: '@aspectjs::weaver.enhance',
    order: 200,
    decorator: function (
      _annotation: Annotation<AnnotationType, AnnotationStub<AnnotationType>>,
      _annotationArgs: unknown[],
      _annotationStub: AnnotationStub<AnnotationType>,
    ) {
      return function (...args: any) {
        // (weaver as any as JitWeaver).enhance();
        throw new Error('Function not implemented.');
      };
    },
  };
};
