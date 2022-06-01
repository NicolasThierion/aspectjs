import type { ReflectContext } from '../../reflect/reflect.context';
import type { AnnotationType, AnnotationStub } from '../annotation.types';
import type { AnnotationFactoryHook } from '../factory/annotation-factory-hook.type';
import { DecoratorTargetArgs } from '../target/target-args';

export function CALL_ANNOTATION_TRIGGERS(
  context: ReflectContext,
): AnnotationFactoryHook<AnnotationType, AnnotationStub> {
  const annotationTriggerRegistry = context.get('annotationTriggerRegistry');
  const targetFactory = context.get('annotationTargetFactory');
  return {
    name: '@aspectjs::annotations.factory-hooks.call-trigger',
    order: 100,
    decorator: (annotation, annotationArgs) => {
      return (...targetArgs: any[]) => {
        const target = targetFactory.get(DecoratorTargetArgs.of(targetArgs));
        annotationTriggerRegistry
          .get(target)
          .get(annotation)
          ?.sort(
            (t1, t2) =>
              (t1.order ?? Number.MAX_SAFE_INTEGER) -
              (t2.order ?? Number.MAX_SAFE_INTEGER - 1),
          )
          .forEach((t) => t.fn(annotation, annotationArgs));
      };
    },
  };
}
