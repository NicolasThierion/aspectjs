import { AnnotationContext } from '../annotation-context';
import type {
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
  // TODO: refactor into a single parameter
  createDecorator: (
    context: AnnotationContext<T, S>,
    annotationStub: S,
  ) => Decorator<T> | void;
  order?: number;
  name: string;
};
