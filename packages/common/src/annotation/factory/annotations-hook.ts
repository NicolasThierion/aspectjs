import type {
  Annotation,
  AnnotationStub,
  AnnotationType,
  Decorator,
} from '../annotation.types';

/**
 * An AnnotationHook is a configuration for the {@link AnnotationFactory}
 * to create annotations baked by to some typescript decorators.
 */
export type AnnotationsHook<
  T extends AnnotationType = AnnotationType,
  S extends AnnotationStub<T> = AnnotationStub<T>
> = {
  decorator: (
    annotation: Annotation<T>,
    annotationArgs: unknown[],
    annotationStub: S
  ) => Decorator | void;
  order: number;
  name: string;
};
