import { DecoratorProviderRegistry } from '../../factory/decorator-provider.registry';
import { AnnotationTargetFactory } from '../../target/annotation-target.factory';
import { AnnotationContextRegistry } from './annotation-context.registry';
import { REGISTER_ANNOTATION_PROVIDER } from './hooks/register-annotation-context.provider';

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
    provide: DecoratorProviderRegistry,
    deps: [DecoratorProviderRegistry],
    factory: (decoratorProviderRegistry: DecoratorProviderRegistry) => {
      return decoratorProviderRegistry.add(REGISTER_ANNOTATION_PROVIDER);
    },
  },
];
