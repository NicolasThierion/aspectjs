import { AnnotationType } from '@aspectjs/common';

import { _CORE_ANNOTATION_FACTORY } from '../utils';

import type { AspectOptions } from './aspect-options.type';
/* eslint-disable @typescript-eslint/no-unused-vars */

export const Aspect = _CORE_ANNOTATION_FACTORY.create(
  AnnotationType.CLASS,
  function Aspect(id: string | AspectOptions = {}) {},
);
