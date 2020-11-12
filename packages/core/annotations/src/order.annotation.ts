import { ASPECTJS_ANNOTATION_FACTORY, AnnotationRef, Decorator } from '@aspectjs/core/commons';

// TODO remove when https://github.com/microsoft/rushstack/issues/1050 is resolved
AnnotationRef;

/**
 * @public
 */
export const OrderAnnotation = ASPECTJS_ANNOTATION_FACTORY.create(function Order(order: number): Decorator {
    return;
});

Object.defineProperties(OrderAnnotation, {
    LOWEST_PRECEDENCE: {
        writable: false,
        value: Infinity,
    },
    HIGHEST_PRECEDENCE: {
        writable: false,
        value: -Infinity,
    },
});
/**
 * @public
 */
export type OrderType = typeof OrderAnnotation & {
    LOWEST_PRECEDENCE: number;
    HIGHEST_PRECEDENCE: number;
};

/**
 * @public
 */
export const Order = OrderAnnotation as OrderType;
