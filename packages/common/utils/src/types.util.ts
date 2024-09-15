/**
 * @internal
 */
export type AbstractConstructorType<X = unknown> = abstract new (
  ...args: any[]
) => X;

export type ConcreteConstructorType<X = unknown> = new (...value: any[]) => X;
export type ConstructorType<X = unknown> =
  | ConcreteConstructorType<X>
  | AbstractConstructorType<X>;

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
