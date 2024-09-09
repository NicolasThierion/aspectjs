import { DecoratorProvider, reflectContext } from '@aspectjs/common';
import { _BindableAnnotationTarget } from '../utils/annotation-mixin-target';
import { JitWeaver } from './jit-weaver';
import { createJitWeaverDecorator } from './jit-weaver-decorator.utils';

export const CALL_JIT_WEAVER_HOOK: DecoratorProvider = {
  name: '@aspectjs::weaver.enhance',
  order: 200,
  createDecorator: function (context) {
    const reflect = reflectContext();
    const weaver = reflect.get(JitWeaver);
    return createJitWeaverDecorator(
      weaver,
      context.target as _BindableAnnotationTarget,
    );
  },
};
