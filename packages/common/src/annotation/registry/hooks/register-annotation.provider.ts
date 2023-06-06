import { AnnotationContext } from '../../annotation-context';
import type { DecoratorProvider } from '../../factory/decorator-provider.type';
import { AnnotationTargetFactory } from '../../target/annotation-target.factory';
import { AnnotationRegistry } from '../annotation.registry';

/**
 * Returns an {@link DecoratorProvider} that adds annotations to the {@link AnnotationRegistry}
 * @param annotationRegistry
 * @returns
 */
export const REGISTER_ANNOTATION_PROVIDER: DecoratorProvider = {
  name: '@aspectjs::hook:registerAnnotation',
  createDecorator: (reflect, annotation, annotationArgs) => {
    const targetFactory = reflect.get(AnnotationTargetFactory);
    const annotationRegistry = reflect.get(AnnotationRegistry);

    return (...targetArgs: any[]) => {
      const target = targetFactory.of(...targetArgs);
      const annotationContext = new AnnotationContext(
        annotation,
        annotationArgs,
        target,
      );
      annotationRegistry.register(annotationContext);
    };
  },
  order: 10,
};
