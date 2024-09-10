import { DecoratorHookRegistry } from '../../factory/decorator-hook.registry';
import { AnnotationTargetFactory } from '../../target/annotation-target.factory';
import { AnnotationContextRegistry } from './annotation-context.registry';
import { REGISTER_ANNOTATION_HOOK } from './hooks/register-annotation-context.hook';

import type { ReflectProvider } from '../../../reflect/reflect-provider.type';

/**
 * @internal
 */
export const ANNOTATION_CONTEXT_REGISTRY_PROVIDERS: ReflectProvider[] = [
  {
    provide: AnnotationContextRegistry,
    deps: [AnnotationTargetFactory],
    factory: (targetFactory: AnnotationTargetFactory) => {
      return new AnnotationContextRegistry(targetFactory);
    },
  },
  {
    provide: DecoratorHookRegistry,
    deps: [DecoratorHookRegistry],
    factory: (decoratorHookRegistry: DecoratorHookRegistry) => {
      return decoratorHookRegistry.add(REGISTER_ANNOTATION_HOOK);
    },
  },
];
