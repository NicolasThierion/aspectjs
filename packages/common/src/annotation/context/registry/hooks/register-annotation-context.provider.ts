import { AnnotationContext } from '../../../annotation-context';
import type { DecoratorProvider } from '../../../factory/decorator-provider.type';
import { AnnotationTargetFactory } from '../../../target/annotation-target.factory';
import { AnnotationContextRegistry } from '../annotation-context.registry';

/**
 * Returns an {@link DecoratorProvider} that adds annotations to the {@link AnnotationContextRegistry}
 * @param annotationContextRegistry
 * @returns
 */
export const REGISTER_ANNOTATION_PROVIDER: DecoratorProvider = {
  name: '@aspectjs::hook:registerAnnotation',
  createDecorator: (reflect, annotation, annotationArgs) => {
    const targetFactory = reflect.get(AnnotationTargetFactory);
    const annotationContextRegistry = reflect.get(AnnotationContextRegistry);

    return (...args: any[]) => {
      const target = targetFactory.of(...args);

      const annotationContext = new AnnotationContext(
        annotation,
        annotationArgs,
        target,
      );
      annotationContextRegistry.register(annotationContext);
    };
  },
  order: 10,
};
