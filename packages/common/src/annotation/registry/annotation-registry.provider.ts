import type { ReflectProvider } from '../../reflect/reflect-provider.type';
import { AnnotationRegistry } from './annotation.registry';

/**
 * Registry for all available annotations.
 * Annotations created throuth the AnnotationFactory will be registered here.
 * @internal
 */
export const ANNOTATION_REGISTRY_PROVIDERS: ReflectProvider[] = [
  {
    provide: AnnotationRegistry,
    factory: () => {
      return new AnnotationRegistry();
    },
  },
];
