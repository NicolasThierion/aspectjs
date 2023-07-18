import { annotationsContext } from '../context/annotations.context.global';
import { AnnotationRegistry } from './annotation.registry';

import type { Annotation } from '../annotation.types';
export const getAnnotations = (...annotations: Annotation[]) =>
  annotationsContext()
    .get(AnnotationRegistry)
    .select(...annotations);
