import type { _AnnotationFactoryHooksRegistry } from '../annotation/factory/annotations-hooks.registry';
import type { AnnotationRegistry } from '../annotation/registry/annotation.registry';
import type { AnnotationTargetFactory } from '../annotation/target/annotation-target.factory';

export interface KnownReflectContextProviders {
  annotationFactoryHooksRegistry: _AnnotationFactoryHooksRegistry;
  annotationRegistry: AnnotationRegistry;
  annotationTargetFactory: AnnotationTargetFactory;
}
