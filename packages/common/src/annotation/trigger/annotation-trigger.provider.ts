import { DecoratorProviderRegistry } from '../factory/decorator-provider.registry';
import { AnnotationRegistry } from '../registry/annotation.registry';
import { CALL_ANNOTATION_TRIGGERS } from './annotation-trigger.hook';
import { AnnotationTriggerRegistry } from './annotation-trigger.registry';

import type { ReflectProvider } from '../../reflect/reflect-provider.type';
/**
 * @internal
 */
export const ANNOTATION_TRIGGER_PROVIDERS: ReflectProvider[] = [
  {
    provide: AnnotationTriggerRegistry,
    deps: [AnnotationRegistry],
    factory: (annotationRegistry: AnnotationRegistry) => {
      return new AnnotationTriggerRegistry(annotationRegistry);
    },
  },
  {
    provide: DecoratorProviderRegistry,
    deps: [DecoratorProviderRegistry],
    factory: (decoratorProviderRegistry: DecoratorProviderRegistry) => {
      return decoratorProviderRegistry.add(CALL_ANNOTATION_TRIGGERS);
    },
  },
];
