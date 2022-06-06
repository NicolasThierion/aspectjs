import type { ReflectProvider } from '../../reflect/reflect-provider.type';
import { _AnnotationFactoryHookRegistry } from '../factory/annotations-hooks.registry';
import { AnnotationRegistry } from '../registry/annotation.registry';
import { AnnotationTargetFactory } from '../target/annotation-target.factory';
import { CALL_ANNOTATION_TRIGGERS } from './annotation-trigger.hook';
import { AnnotationTriggerRegistry } from './annotation-trigger.registry';

export const ANNOTATION_TRIGGER_PROVIDERS: ReflectProvider[] = [
  {
    provide: AnnotationTriggerRegistry,
    deps: [AnnotationRegistry],
    factory: (annotationRegistry: AnnotationRegistry) => {
      return new AnnotationTriggerRegistry(annotationRegistry);
    },
  },
  {
    provide: _AnnotationFactoryHookRegistry,
    deps: [
      _AnnotationFactoryHookRegistry,
      AnnotationTriggerRegistry,
      AnnotationTargetFactory,
    ],
    factory: (
      annotationHookRegistry: _AnnotationFactoryHookRegistry,
      annotationTriggerRegistry: AnnotationTriggerRegistry,
      targetFactory: AnnotationTargetFactory,
    ) => {
      return annotationHookRegistry.add(
        CALL_ANNOTATION_TRIGGERS(annotationTriggerRegistry, targetFactory),
      );
    },
  },
];
