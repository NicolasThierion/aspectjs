import { AnnotationRegistry } from './annotation.registry';

import { reflectContext } from '../../reflect/reflect.context.global';
import type { Annotation, AnnotationStub } from '../annotation.types';
import { AnnotationByTargetSelector } from './by-target-selector';

export function getAnnotations<S extends AnnotationStub>(
  annotation: S,
): AnnotationByTargetSelector<S>;
export function getAnnotations<S extends AnnotationStub>(
  ...annotations: S[]
): AnnotationByTargetSelector<S>;
export function getAnnotations(
  ...annotations: Annotation[]
): AnnotationByTargetSelector {
  return reflectContext()
    .get(AnnotationRegistry)
    .select(...annotations);
}
