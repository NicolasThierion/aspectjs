import { ReflectContext } from '../../reflect/reflect.context';
import { AnnotationContext } from '../annotation-context';
import type {
  AnnotationKind,
  AnnotationStub,
  Decorator,
} from '../annotation.types';

/**
 * @internal
 * A DecoratorHook is a configuration for the {@link AnnotationFactory}
 * to create typescript decorators that corresponds to a given annotation.
 */
export type DecoratorHook<
  T extends AnnotationKind = AnnotationKind,
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
