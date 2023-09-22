import { AnnotationRegistry } from './annotation.registry';

import { reflectContext } from '../../public_api';
import type { Annotation, AnnotationStub } from '../annotation.types';
import { AnnotationsSelection } from './selection';

export function getAnnotations<S extends AnnotationStub>(
  annotation: S,
): AnnotationsSelection<S>;
export function getAnnotations<S extends AnnotationStub>(
  ...annotations: S[]
): AnnotationsSelection<S>;
export function getAnnotations(
  ...annotations: Annotation[]
): AnnotationsSelection {
  return reflectContext()
    .get(AnnotationRegistry)
    .select(...annotations);
}
