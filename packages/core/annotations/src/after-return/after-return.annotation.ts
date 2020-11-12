import { PointcutExpression, AnnotationRef, ASPECTJS_ANNOTATION_FACTORY } from '@aspectjs/core/commons';

// TODO remove when https://github.com/microsoft/rushstack/issues/1050 is resolved
AnnotationRef;

/**
 * @public
 */
export const AfterReturn = ASPECTJS_ANNOTATION_FACTORY.create(function AfterReturn(
    pointcutExp: PointcutExpression,
): MethodDecorator {
    return;
});
