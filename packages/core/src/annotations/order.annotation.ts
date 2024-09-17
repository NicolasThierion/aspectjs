/* eslint-disable @typescript-eslint/no-unused-vars */
import { _CORE_ANNOTATION_FACTORY } from '../utils';

const OrderAnnotation = _CORE_ANNOTATION_FACTORY.create(function Order(
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  precedence: number,
) {});

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
