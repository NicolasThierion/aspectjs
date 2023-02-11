import { ReflectProvider } from '@aspectjs/common';

import { AdviceRegistry } from '../advice/registry/advice.registry';
import { WeaverContext } from '../weaver/context/weaver.context';
import { AspectRegistry } from './aspect.registry';

/**
 * @internal
 */
export const ASPECT_PROVIDERS: ReflectProvider[] = [
  {
    provide: AspectRegistry,
    deps: [WeaverContext],
    factory: (weaverContext: WeaverContext) => {
      return new AspectRegistry(weaverContext);
    },
  },
  {
    provide: AdviceRegistry,
    deps: [WeaverContext],
    factory: (weaverContext: WeaverContext) => {
      return new AdviceRegistry(weaverContext);
    },
  },
];
