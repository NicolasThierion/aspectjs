import { ConstructorType } from '@aspectjs/common/utils';

/**
 * @internal
 * Type provided by a ReflectProvider
 */
export type ReflectProviderType<T> = ConstructorType<T> & {
  __providerName?: string;
};

/**
 * @internal
 * Provide a service to the Reflect Context
 */
export type ReflectProvider<T = unknown> = {
  deps?: (ConstructorType<unknown> | string)[];
  provide: ReflectProviderType<T> | string;
  factory: (...args: any[]) => T;
};
