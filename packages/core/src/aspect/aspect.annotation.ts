import { AnnotationKind } from '@aspectjs/common';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Weaver } from './../weaver/weaver';

import { _CORE_ANNOTATION_FACTORY } from '../utils';

import type { AspectOptions } from './aspect-metadata.type';
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Use the `@Aspect()` annotation on a class to mark that class as an aspect.
 * The aspect could then be enabled with the {@link Weaver.enable} method.
 *
 * @example
 * ```ts
 * @Aspect()
 * class MyAspect {
 * }
 *
 * getWeaver().enable(new MyAspect());
 * ```
 */
export const Aspect = _CORE_ANNOTATION_FACTORY.create(
  AnnotationKind.CLASS,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment,@typescript-eslint/no-unused-vars
  // @ts-ignore
  function Aspect(id: string | AspectOptions = {}) {},
);
