import { assert } from '@aspectjs/common/utils';
import { _BindableAnnotationTarget } from '../utils/annotation-mixin-target';
import { JitWeaver } from './jit-weaver';

export const createJitWeaverDecorator = (
  weaver: JitWeaver,
  target: _BindableAnnotationTarget,
) => {
  return function (...args: any) {
    assert(typeof target._bind === 'function');
    return weaver.enhance(target);
  };
};
