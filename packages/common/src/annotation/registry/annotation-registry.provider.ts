import { DecoratorProviderRegistry } from '../factory/decorator-provider.registry';
import { AnnotationTargetFactory } from '../target/annotation-target.factory';
import { AnnotationRegistry } from './annotation.registry';
import { REGISTER_ANNOTATION_PROVIDER } from './hooks/register-annotation.provider';

import type { ReflectProvider } from '../../reflect/reflect-provider.type';
/**
 * @internal
 */
export const ANNOTATION_REGISTRY_PROVIDERS: ReflectProvider[] = [
  {
    provide: AnnotationRegistry,
    deps: [AnnotationTargetFactory],
    factory: (targetFactory: AnnotationTargetFactory) => {
      return new AnnotationRegistry(targetFactory);
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
