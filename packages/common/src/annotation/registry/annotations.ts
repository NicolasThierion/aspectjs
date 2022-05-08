import { reflectContext } from '../../reflect/reflect.context';
import type { Annotation } from '../annotation.types';

export const annotations = (...annotations: Annotation[]) =>
  reflectContext()
    .get('annotationRegistry')
    .find(...annotations);
