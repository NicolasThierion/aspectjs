import {
  Annotation,
  AnnotationStub,
  AnnotationTargetFactory,
  AnnotationType,
  DecoratorProvider,
} from '@aspectjs/common';
import { JitWeaver } from './jit-weaver';
import { createJitWeaverDecorator } from './jit-weaver-decorator.utils';

export const CALL_JIT_WEAVER_HOOK: DecoratorProvider = {
  name: '@aspectjs::weaver.enhance',
  order: 200,
  createDecorator: function (
    reflect,
    _annotation: Annotation<AnnotationType, AnnotationStub<AnnotationType>>,
    _annotationArgs: unknown[],
    _annotationStub: AnnotationStub<AnnotationType>,
  ) {
    const weaver = reflect.get(JitWeaver);
    const targetFactory = reflect.get(AnnotationTargetFactory);
    return createJitWeaverDecorator(weaver, targetFactory);
  },
};
