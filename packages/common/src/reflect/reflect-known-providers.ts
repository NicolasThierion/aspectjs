import type { _AnnotationFactoryHooksRegistry } from '../annotation/factory/annotations-hooks.registry';
import type { AnnotationRegistry } from '../annotation/registry/annotation.registry';
import type { AnnotationTargetFactory } from '../annotation/target/annotation-target.factory';
import type { AnnotationTriggerRegistry } from '../annotation/trigger/annotation-trigger.registry';

export interface KnownReflectContextProviders {
  annotationFactoryHooksRegistry: _AnnotationFactoryHooksRegistry;
  annotationRegistry: AnnotationRegistry;
  annotationTargetFactory: AnnotationTargetFactory;
  annotationTriggerRegistry: AnnotationTriggerRegistry;
}
