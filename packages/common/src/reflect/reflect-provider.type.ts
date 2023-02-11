import { ConstructorType } from '@aspectjs/common/utils';

/**
 * Type provided by a ReflectProvider
 * @internal
 */
export type ReflectProviderType<T> = ConstructorType<T> & {
  __providerName?: string;
};

/**
 * Provide a service to the Reflect Context
 */
export type ReflectProvider<T = unknown> = {
  deps?: (ConstructorType<unknown> | string)[];
  provide: ReflectProviderType<T> | string;
  factory: (...args: any[]) => T;
};
