import type { ReflectContext } from '../../reflect/reflect.context';
import type {
  Annotation,
  AnnotationStub,
  AnnotationType,
  Decorator,
} from '../annotation.types';

/**
 * @internal
 * @description A DecoratorProvider is a configuration for the {@link AnnotationFactory}
 * to create typescript decorators that corresponds to a given annotation.
 */
export type DecoratorProvider<
  T extends AnnotationType = AnnotationType,
  S extends AnnotationStub<T> = AnnotationStub<T>,
> = {
  createDecorator: (
    context: ReflectContext,
    annotation: Annotation<T>,
    annotationArgs: unknown[],
    annotationStub: S,
  ) => Decorator<T> | void;
  order?: number;
  name: string;
};
