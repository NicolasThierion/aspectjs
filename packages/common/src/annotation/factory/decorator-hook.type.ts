import { ReflectContext } from '../../reflect/reflect.context';
import { AnnotationContext } from '../annotation-context';
import type {
  AnnotationStub,
  AnnotationType,
  Decorator,
} from '../annotation.types';

/**
 * @internal
 * @description A DecoratorHook is a configuration for the {@link AnnotationFactory}
 * to create typescript decorators that corresponds to a given annotation.
 */
export type DecoratorHook<
  T extends AnnotationType = AnnotationType,
  S extends AnnotationStub<T> = AnnotationStub<T>,
> = {
  // TODO: refactor into a single parameter
  createDecorator: (
    reflect: ReflectContext,
    context: AnnotationContext<T, S>,
    annotationStub: S,
  ) => Decorator<T> | void;
  order?: number;
  name: string;
};
