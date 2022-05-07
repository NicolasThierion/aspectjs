import { _AnnotationContextImpl } from '../../annotation-context';
import type { AnnotationFactoryHook } from '../../factory/annotation-factory-hook.type';
import type { AnnotationTargetFactory } from '../../target/annotation-target.factory';
import { DecoratorTargetArgs } from '../../target/target-args';
import type { AnnotationRegistry } from '../annotation.registry';

/**
 * Returns an {@link AnnotationsHook} to add annotations to the {@link _AnnotationRegistry}
 * @param annotationRegistry
 * @returns
 */
export const REGISTER_ANNOTATION_HOOK = (
  targetFactory: AnnotationTargetFactory,
  annotationRegistry: AnnotationRegistry,
): AnnotationFactoryHook => ({
  name: '@aspectjs::hook:registerAnnotation',
  decorator: (annotation, annotationArgs) => {
    return (...targetArgs: any[]) => {
      const target = targetFactory.register(DecoratorTargetArgs.of(targetArgs));
      const annotationContext = new _AnnotationContextImpl(
        annotation,
        annotationArgs,
        target,
      );
      annotationRegistry.register(annotationContext);
    };
  },
  order: 10,
});
