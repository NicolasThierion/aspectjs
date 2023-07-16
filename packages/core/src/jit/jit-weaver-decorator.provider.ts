import {
  Annotation,
  AnnotationStub,
  AnnotationTargetFactory,
  AnnotationType,
  DecoratorProvider,
} from '@aspectjs/common';
import { assert } from '@aspectjs/common/utils';
import { _BindableAnnotationTarget } from '../utils/bindable-annotation-target';
import { JitWeaver } from './jit-weaver';

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

export const createJitWeaverDecorator = (
  weaver: JitWeaver,
  targetFactory: AnnotationTargetFactory,
) => {
  return function (...args: any) {
    const target = targetFactory.of(...args) as _BindableAnnotationTarget;
    assert(typeof target._bind === 'function');
    return weaver.enhance(target);
  };
};
