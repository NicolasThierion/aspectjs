import { AnnotationRef, PointcutExpression, ASPECTJS_ANNOTATION_FACTORY } from '@aspectjs/core/commons';

// TODO remove when https://github.com/microsoft/rushstack/issues/1050 is resolved
AnnotationRef;

/**
 * @public
 */
export const After = ASPECTJS_ANNOTATION_FACTORY.create(function After(
    pointcutExp: PointcutExpression,
): MethodDecorator {
    return;
});
