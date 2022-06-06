import type { Annotation } from '../annotation.types';
import { annotationsContext } from '../context/annotations.context.global';
import { AnnotationRegistry } from './annotation.registry';

export const annotations = (...annotations: Annotation[]) =>
  annotationsContext()
    .get(AnnotationRegistry)
    .find(...annotations);
