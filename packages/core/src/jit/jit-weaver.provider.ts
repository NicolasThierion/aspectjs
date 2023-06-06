import {
  DecoratorProviderRegistry,
  ReflectProvider,
  annotationsContext,
} from '@aspectjs/common';

import { WeaverContext } from '../weaver/context/weaver.context';
import { JitWeaver } from './jit-weaver';
import { CALL_JIT_WEAVER_HOOK } from './jit-weaver-decorator.provider';
import { JoinPointFactory } from './joinpoint.factory';

export const JIT_WEAVER_PROVIDERS: ReflectProvider[] = [
  {
    provide: WeaverContext,
    factory: () => annotationsContext() as WeaverContext, // do not rely on weaver-context.global, to avoid circular dep
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
];
