import { AnnotationContext } from '../annotation-context';
import type { AnnotationStub, AnnotationType } from '../annotation.types';
import type { AnnotationFactoryHook } from '../factory/annotation-factory-hook.type';
import type { AnnotationTargetFactory } from '../target/annotation-target.factory';
import { DecoratorTargetArgs } from '../target/target-args';
import type { AnnotationTriggerRegistry } from './annotation-trigger.registry';

export const CALL_ANNOTATION_TRIGGERS = (
  annotationTriggerRegistry: AnnotationTriggerRegistry,
  targetFactory: AnnotationTargetFactory,
): AnnotationFactoryHook<AnnotationType, AnnotationStub> => {
  return {
    name: '@aspectjs::annotations.factory-hooks.call-trigger',
    order: 100,
    decorator: (annotation, annotationArgs) => {
      return (...targetArgs: any[]) => {
        const target = targetFactory.get(DecoratorTargetArgs.of(targetArgs));
        annotationTriggerRegistry.call(
          new AnnotationContext(annotation, annotationArgs, target),
        );
      };
    },
  };
};
