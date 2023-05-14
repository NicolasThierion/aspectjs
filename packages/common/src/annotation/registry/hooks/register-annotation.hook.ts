import { BindableAnnotationContext } from '../../annotation-context';
import type { AnnotationFactoryHook } from '../../factory/annotation-factory-hook.type';
import type { AnnotationTargetFactory } from '../../target/annotation-target.factory';
import type { AnnotationRegistry } from '../annotation.registry';

/**
 * Returns an {@link AnnotationFactoryHook} that adds annotations to the {@link AnnotationRegistry}
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
      const target = targetFactory.of(...targetArgs);
      const annotationContext = new BindableAnnotationContext(
        annotation,
        annotationArgs,
        target,
      );
      annotationRegistry.register(annotationContext);
    };
  },
  order: 10,
});
