import type { AnnotationType } from '@aspectjs/common';
import { _CORE_ANNOTATION_FACTORY } from '../utils';
import type { AspectOptions } from './aspect-options.type';

/**
 * @public
 */
export const Aspect = _CORE_ANNOTATION_FACTORY.create<AnnotationType.CLASS>(
  'Aspect',
  function Aspect(id: string | AspectOptions = {}) {},
);
