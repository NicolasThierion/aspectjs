import { ASPECTJS_ANNOTATION_FACTORY } from '../utils/utils';
import { Decorator } from '../annotation/annotation.types';

const OrderAnnotation = ASPECTJS_ANNOTATION_FACTORY.create(function Order(order: number): Decorator {
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
export type OrderType = typeof OrderAnnotation & {
    LOWEST_PRECEDENCE: number;
    HIGHEST_PRECEDENCE: number;
};

export const Order = OrderAnnotation as OrderType;
