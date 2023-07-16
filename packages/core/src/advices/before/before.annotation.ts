import { AnnotationType } from '@aspectjs/common';
import type { PointcutExpression } from '../../pointcut/pointcut-expression.type';
import { _CORE_ANNOTATION_FACTORY } from '../../utils';
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Annotation to declare an advice to be applied before a method.
 *
 * @description The Before annotation is used to apply before advice
 * to a method. Before advice is executed before the target method starts its execution.
 * It is commonly used to perform setup tasks, parameter validation, or additional actions
 * that need to be executed before the method's execution.
 *
 * @param pointcutExp (required): The pointcut expression
 * specifying the join points where the before advice should be applied.
 *
 * @returns An ES decorator representing the Before annotation.
 *
 * @example
 * ```ts
 * import { Before, on } from '@aspectjs/core';
 *
 * class MyClass {
 *   @Before(on.classes.withAnnotations(SomeAnnotation))
 *   myMethod() {
 *     // Method implementation
 *   }
 * }
 * ```
 */
export const Before = _CORE_ANNOTATION_FACTORY.create(
  AnnotationType.METHOD,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  function Before(...pointcutExps: PointcutExpression[]) {},
);
