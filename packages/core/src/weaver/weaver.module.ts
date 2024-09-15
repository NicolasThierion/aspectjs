import {
  AnnotationContextRegistry,
  AnnotationTargetFactory,
  DecoratorHookRegistry,
  ReflectModule,
  reflectContext,
} from '@aspectjs/common';

import { WeaverContext } from './context/weaver.context';

import { JitWeaver } from '../jit/jit-weaver';
import { CALL_JIT_WEAVER_HOOK } from '../jit/jit-weaver.hook';
import { JoinPointFactory } from '../jit/joinpoint.factory';

import { AdviceSorter } from '../advice/advice-sort';
import { AdviceRegistry } from '../advice/registry/advice.registry';
import { AspectRegistry } from '../aspect/aspect.registry';
import { _CompilationState } from './compilation-state.provider';

@ReflectModule({
  providers: [
    {
      provide: AspectRegistry,
      deps: [WeaverContext],
      factory: (weaverContext: WeaverContext) => {
        return new AspectRegistry(weaverContext);
      },
    },
    {
      provide: AdviceRegistry,
      deps: [AdviceSorter],
      factory: (adviceSort: AdviceSorter) => {
        return new AdviceRegistry(adviceSort);
      },
    },
    {
      provide: AdviceSorter,
      deps: [AnnotationContextRegistry, AnnotationTargetFactory],
      factory: (
        annotationContextRegistry: AnnotationContextRegistry,
        annotationTargetFactory: AnnotationTargetFactory,
      ) => {
        return new AdviceSorter(
          annotationContextRegistry,
          annotationTargetFactory,
        );
      },
    },
    {
      provide: WeaverContext,
      factory: () => reflectContext() as WeaverContext, // do not rely on weaver-context.global, to avoid circular dep
    },
    {
      provide: JitWeaver,
      deps: [WeaverContext],
      factory: (weaverContext: WeaverContext) => new JitWeaver(weaverContext),
    } as any,
    {
      provide: DecoratorHookRegistry,
      deps: [DecoratorHookRegistry],
      factory: (decoratorHookRegistry: DecoratorHookRegistry) => {
        return decoratorHookRegistry.add(CALL_JIT_WEAVER_HOOK);
      },
    },
    {
      provide: JoinPointFactory,
      factory: () => new JoinPointFactory(),
    },
    {
      provide: _CompilationState,
      factory: () => new _CompilationState(),
    },
  ],
})
export class WeaverModule {
  //eslint-disable-next-line
}

const TEST_TEARDOWN_SYMBOL = Symbol.for('@ajs:ttd');

Object.defineProperty(WeaverModule, TEST_TEARDOWN_SYMBOL, {
  value: () =>
    reflectContext().get(DecoratorHookRegistry).remove(CALL_JIT_WEAVER_HOOK),
});
