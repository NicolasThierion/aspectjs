import { weaverContext } from '../weaver/context/weaver.context.global';
import { JitWeaver } from './jit-weaver';

import type {
  Annotation,
  AnnotationFactoryHook,
  AnnotationStub,
  AnnotationTargetFactory,
  AnnotationType,
} from '@aspectjs/common';
export const CALL_JIT_WEAVER_HOOK = (
  targetFactory: AnnotationTargetFactory,
): AnnotationFactoryHook => {
  const weaver = weaverContext().get(JitWeaver);

  return {
    name: '@aspectjs::weaver.enhance',
    order: 200,
    decorator: function (
      _annotation: Annotation<AnnotationType, AnnotationStub<AnnotationType>>,
      _annotationArgs: unknown[],
      _annotationStub: AnnotationStub<AnnotationType>,
    ) {
      return function (...args: any) {
        const target = targetFactory.of(...args);

        return weaver.enhance(target);
      };
    },
  };
};
