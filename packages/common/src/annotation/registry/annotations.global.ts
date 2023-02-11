import { annotationsContext } from '../context/annotations.context.global';
import { AnnotationRegistry } from './annotation.registry';

import type { Annotation } from '../annotation.types';
export const annotations = (...annotations: Annotation[]) =>
  annotationsContext()
    .get(AnnotationRegistry)
    .select(...annotations);
