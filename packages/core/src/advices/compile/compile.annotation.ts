import { AnnotationType } from '@aspectjs/common';
import type { PointcutExpression } from '../../pointcut/pointcut-expression.type';
import { _CORE_ANNOTATION_FACTORY } from '../../utils';
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Annotation to declare an advice to be applied at compile time, when a symnol is read bu the interpreter.
 *
 * @description The Compile annotation is used to apply compile advice
 * to a symbol. Compile advices are executed once, when the decorators are evaluated by the interpreter.
 *
 * @param pointcutExp (required): The pointcut expression
 * specifying the join points where the compile advice should be applied.
 *
 * @returns An ES decorator representing the Compile annotation.
 *
 * @example
 * ```ts
 * import { Compile, on } from '@aspectjs/core';
 *
 * class MyClass {
 *   @Compile(on.classes.withAnnotations(SomeAnnotation))
 *   myMethod() {
 *     // Method implementation
 *   }
 * }
 * ```
 */
export const Compile = _CORE_ANNOTATION_FACTORY.create(
  AnnotationType.METHOD,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  function Compile(...pointcutExp: PointcutExpression[]) {},
);
