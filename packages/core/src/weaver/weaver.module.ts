import {
  AnnotationRegistry,
  AnnotationTargetFactory,
  DecoratorProviderRegistry,
  ReflectModule,
  ReflectProvider,
  reflectContext,
} from '@aspectjs/common';

import { WeaverContext } from './context/weaver.context';

import { JitWeaver } from '../jit/jit-weaver';
import { CALL_JIT_WEAVER_HOOK } from '../jit/jit-weaver-decorator.provider';
import { JoinPointFactory } from '../jit/joinpoint.factory';

import { AdviceSorter } from '../advice/advice-sort';
import { AdviceRegistry } from '../advice/registry/advice.registry';
import { AspectRegistry } from '../aspect/aspect.registry';

/**
 * @internal
 */
export const ASPECT_PROVIDERS: ReflectProvider[] = [];

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
      deps: [WeaverContext, AdviceSorter],
      factory: (weaverContext: WeaverContext, adviceSort: AdviceSorter) => {
        return new AdviceRegistry(weaverContext, adviceSort);
      },
    },
    {
      provide: AdviceSorter,
      deps: [AnnotationRegistry, AnnotationTargetFactory],
      factory: (
        annotationRegistry: AnnotationRegistry,
        annotationTargetFactory: AnnotationTargetFactory,
      ) => {
        return new AdviceSorter(annotationRegistry, annotationTargetFactory);
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
      provide: DecoratorProviderRegistry,
      deps: [DecoratorProviderRegistry],
      factory: (decoratorProviderRegistry: DecoratorProviderRegistry) => {
        return decoratorProviderRegistry.add(CALL_JIT_WEAVER_HOOK);
      },
    },
    {
      provide: JoinPointFactory,
      factory: () => new JoinPointFactory(),
    },
  ],
})
export class WeaverModule {
  //eslint-disable-next-line
}

const TEST_TEARDOWN_SYMBOL = Symbol.for('@ajs:ttd');

Object.defineProperty(WeaverModule, TEST_TEARDOWN_SYMBOL, {
  value: () =>
    reflectContext()
      .get(DecoratorProviderRegistry)
      .remove(CALL_JIT_WEAVER_HOOK),
});
