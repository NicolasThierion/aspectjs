import { DecoratorHook, reflectContext } from '@aspectjs/common';
import { assert } from '@aspectjs/common/utils';
import { _BindableAnnotationTarget } from '../utils/annotation-mixin-target';
import { _CompilationState } from '../weaver/compilation-state.provider';
import { JitWeaver } from './jit-weaver';

export const CALL_JIT_WEAVER_HOOK: DecoratorHook = {
  name: '@aspectjs::weaver.enhance',
  order: 200,
  createDecorator: function (reflect, context) {
    const weaver = reflect.get(JitWeaver);

    return function (..._decoratorArgs: any) {
      const target = context.target as _BindableAnnotationTarget;
      assert(typeof target._bind === 'function');
      const state = reflectContext().get(_CompilationState);

      // already enhanced, skip calling the weaver.
      // this might happen when doing a mixin between two annotations.

      // dynamically add the annotation to advices selection filter
      if (state.status === _CompilationState.Status.PENDING) {
        assert(!!state.advices);
        // add the current annotation to the list of known annotations for advices
        state.advices!.filters.annotations ??= [];
        state.advices!.filters.annotations.push(context.ref);
        return;
      } else {
        const decoree = weaver.enhance(target);
        return decoree;
      }
    };
  },
};
