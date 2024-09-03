import { AnnotationTargetFactory } from '@aspectjs/common';
import { assert } from '@aspectjs/common/utils';
import { _BindableAnnotationTarget } from '../utils/bindable-annotation-target';
import { JitWeaver } from './jit-weaver';

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
