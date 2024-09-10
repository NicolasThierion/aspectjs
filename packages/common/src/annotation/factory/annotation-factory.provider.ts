import { DecoratorHookRegistry } from './decorator-hook.registry';
import { CALL_ANNOTATION_STUB } from './hooks/call-annotation-stub.hook';

import type { ReflectProvider } from '../../reflect/reflect-provider.type';

/**
 * @internal
 */
export const ANNOTATION_HOOK_REGISTRY_PROVIDERS: ReflectProvider[] = [
  {
    provide: DecoratorHookRegistry,
    factory: () => {
      return (
        new DecoratorHookRegistry()
          // .add(SETUP_JIT_CANVAS_DECORATOR_PROVIDER)
          .add(CALL_ANNOTATION_STUB)
      );
    },
  },
];
