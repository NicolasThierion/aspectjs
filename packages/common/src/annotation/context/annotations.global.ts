import { AnnotationContextRegistry } from './registry/annotation-context.registry';

import { reflectContext } from '../../reflect/reflect.context.global';
import type { Annotation, AnnotationStub } from '../annotation.types';
import { AnnotationByTargetSelector } from './registry/by-target-selector';

export function getAnnotations<S extends AnnotationStub>(
  annotation: S,
): AnnotationByTargetSelector<S>;
export function getAnnotations(
  ...annotations: Annotation[]
): AnnotationByTargetSelector;
export function getAnnotations(
  ...annotations: Annotation[]
): AnnotationByTargetSelector {
  return reflectContext()
    .get(AnnotationContextRegistry)
    .select(...annotations);
}
