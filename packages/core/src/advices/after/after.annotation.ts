import { AnnotationType } from '@aspectjs/common';
import type { PointcutExpression } from '../../pointcut/pointcut-expression.type';
import { _CORE_ANNOTATION_FACTORY } from '../../utils';
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Annotation to declare an advice to be applied after a method.
 * @description The After annotation is used to apply after advice to a method.
 *              After advice is executed after the target method completes its execution normally or with an error.
 *              It is commonly used to perform cleanup tasks, logging, or additional actions that need to be executed
 *              after the method's execution.
 * @param pointcutExp - The pointcut expression specifying the join points where the after advice should be applied.
 * @returns An ES decorator representing the After annotation.
 *
 * @example
 * ```ts
 * import { After, on } from '@aspectjs/core';
 *
 * class MyClass {
 *   @After(on.classes.withAnnotations(SomeAnnotation))
 *   myMethod() {
 *     // Method implementation
 *   }
 * }
 * ```
 */

export const After = _CORE_ANNOTATION_FACTORY.create(
  AnnotationType.METHOD,
  function After(pointcutExp: PointcutExpression) {},
);
