/**
 * @internal
 */
export type ConstructorType<X = unknown> = {
  new (...value: any[]): X;
};

/**
 * @internal
 */
export type MethodPropertyDescriptor = PropertyDescriptor & {
  value: (...args: any[]) => any;
  get: never;
};

/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type Prototype<X = unknown> = Record<string, any> & {
  // eslint-disable-next-line @typescript-eslint/ban-types
  constructor: ConstructorType<X>;
};
