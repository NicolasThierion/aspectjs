import { AnnotationContext } from '../../annotation-context';
import type { DecoratorProvider } from '../../factory/decorator-provider.type';
import { AnnotationTargetFactory } from '../../target/annotation-target.factory';
import { _findOrCreateAnnotationTarget } from '../../target/annotation-target.utils';
import { DecoratorTargetArgs } from '../../target/target-args';
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

    return (...args: any[]) => {
      // Do not use targetFactory.of() to bypass safety checks and instance binding
      const targetArgs = DecoratorTargetArgs.of(args);
      const target = _findOrCreateAnnotationTarget(targetFactory, targetArgs);

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
