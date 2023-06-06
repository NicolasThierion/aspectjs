import { DecoratorProviderRegistry } from './decorator-provider.registry';
import { CALL_ANNOTATION_STUB } from './hooks/call-annotation-stub.provider';

import type { ReflectProvider } from '../../reflect/reflect-provider.type';
/**
 * @internal
 */
export const ANNOTATION_HOOK_REGISTRY_PROVIDERS: ReflectProvider[] = [
  {
    provide: DecoratorProviderRegistry,
    factory: () => {
      return new DecoratorProviderRegistry().add(CALL_ANNOTATION_STUB);
    },
  },
];
