import { AnnotationContext } from '../annotation-context';
import type { AnnotationStub, AnnotationType } from '../annotation.types';
import type { DecoratorProvider } from '../factory/decorator-provider.type';
import { AnnotationTargetFactory } from '../target/annotation-target.factory';
import { AnnotationTriggerRegistry } from './annotation-trigger.registry';

export const CALL_ANNOTATION_TRIGGERS: DecoratorProvider<
  AnnotationType,
  AnnotationStub
> = {
  name: '@aspectjs::annotations.factory-hooks.call-trigger',
  order: 100,
  createDecorator: (reflect, annotation, annotationArgs) => {
    const annotationTriggerRegistry = reflect.get(AnnotationTriggerRegistry);
    const targetFactory = reflect.get(AnnotationTargetFactory);
    return (...targetArgs: any[]) => {
      const target = targetFactory.of(...targetArgs);
      annotationTriggerRegistry.call(
        new AnnotationContext(annotation, annotationArgs, target),
      );
    };
  },
};
