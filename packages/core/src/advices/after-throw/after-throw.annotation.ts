import { AnnotationKind } from '@aspectjs/common';
import type { PointcutExpression } from '../../pointcut/pointcut-expression.type';
import { _CORE_ANNOTATION_FACTORY } from '../../utils';
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Annotation to declare an advice to be applied after a method throws an exception.
 *
 * @description The AfterThrow annotation is used to apply after-throwing advice to a method.
 *              After-throwing advice is executed after the target method throws an exception.
 *              It is commonly used to handle exceptions, perform cleanup tasks, or additional actions
 *              that need to be executed after an exception is thrown.
 *
 * @param pointcutExp - The pointcut expression specifying the join points where the after-throwing advice should be applied.
 * @returns An ES decorator representing the AfterThrow annotation.
 *
 * @example
 * ```typescript
 * import { AfterThrow, on } from '@aspectjs/core';
 *
 * class MyClass {
 *   @AfterThrow(on.classes.withAnnotations(SomeAnnotation))
 *   myMethod() {
 *     // Method implementation
 *   }
 * }
 * ```
 */
export const AfterThrow = _CORE_ANNOTATION_FACTORY.create(
  AnnotationKind.METHOD,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment,@typescript-eslint/no-unused-vars
  // @ts-ignore
  function AfterThrow(...pointcutExps: PointcutExpression[]) {},
);
