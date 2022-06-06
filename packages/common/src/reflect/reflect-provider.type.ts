type ConstructorType<T> = new (...args: any[]) => T;
type ProviderType<T> = ConstructorType<T> & { __providerName?: string };

export type ReflectProvider<T = unknown> = {
  deps?: (ConstructorType<unknown> | string)[];
  provide: ProviderType<T> | string;
  factory: (...args: any[]) => T;
};
