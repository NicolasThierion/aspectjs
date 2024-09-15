import type { DecoratorHook } from '../../../factory/decorator-hook.type';
import { AnnotationContextRegistry } from '../annotation-context.registry';

/**
 * Returns an {@link DecoratorHook} that adds annotations to the {@link AnnotationContextRegistry}
 * @param annotationContextRegistry
 * @returns
 */
export const REGISTER_ANNOTATION_HOOK: DecoratorHook = {
  name: '@aspectjs::hook:registerAnnotation',
  createDecorator: (reflect, context) => {
    const annotationContextRegistry = reflect.get(AnnotationContextRegistry);
    annotationContextRegistry.register(context);
  },
  order: 10,
};
