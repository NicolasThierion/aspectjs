import { AnnotationType } from '@aspectjs/common';
import type { PointcutExpression } from '../../pointcut/pointcut-expression.type';
import { _CORE_ANNOTATION_FACTORY } from '../../utils';
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Annotation to declare an advice to be applied around a method.
 *
 * @description The Around annotation is used to apply around advice to a method.
 *              Around advice is executed before and after the target method's execution.
 *              It allows full control over the method's execution by intercepting the method invocation.
 *              It is commonly used for method interception, performance monitoring, or transaction management.
 *
 * @param pointcutExp - The pointcut expression specifying the join points where the around advice should be applied.
 * @returns An ES decorator representing the Around annotation.
 *
 * @example
 * ```typescript
 * import { Around, on } from '@aspectjs/core';
 *
 * class MyClass {
 *   @Around(on.classes.withAnnotations(SomeAnnotation))
 *   applyAroundAdvice(ctxt: AroundContext) {
 *     // Method implementation
 *   }
 * }
 * ```
 */
export const Around = _CORE_ANNOTATION_FACTORY.create(
  AnnotationType.METHOD,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  function Around(...pointcutExps: PointcutExpression[]) {},
);
