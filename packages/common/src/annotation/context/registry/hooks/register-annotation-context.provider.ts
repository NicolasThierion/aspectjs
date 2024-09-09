import { reflectContext } from '../../../../public_api';
import type { DecoratorProvider } from '../../../factory/decorator-provider.type';
import { AnnotationContextRegistry } from '../annotation-context.registry';

/**
 * Returns an {@link DecoratorProvider} that adds annotations to the {@link AnnotationContextRegistry}
 * @param annotationContextRegistry
 * @returns
 */
export const REGISTER_ANNOTATION_PROVIDER: DecoratorProvider = {
  name: '@aspectjs::hook:registerAnnotation',
  createDecorator: (context) => {
    const reflect = reflectContext();
    const annotationContextRegistry = reflect.get(AnnotationContextRegistry);

    return (...args: any[]) => {
      annotationContextRegistry.register(context);
    };
  },
  order: -130,
};
