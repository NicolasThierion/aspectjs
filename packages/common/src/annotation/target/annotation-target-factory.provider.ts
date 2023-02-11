import type { ReflectProvider } from '../../reflect/reflect-provider.type';
import { AnnotationTargetFactory } from './annotation-target.factory';

/**
 * @internal
 */
export const ANNOTATION_TARGET_FACTORY_PROVIDERS: ReflectProvider[] = [
  {
    provide: AnnotationTargetFactory,
    factory: () => {
      return new AnnotationTargetFactory();
    },
  },
];
