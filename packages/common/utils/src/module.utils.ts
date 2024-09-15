import { assert } from '@aspectjs/common/utils';
import { ReflectModuleConfiguration } from '../../src/reflect/module/reflect-module-config.type';
import { ReflectProvider } from '../../src/reflect/reflect-provider.type';

export function getProviders(m: unknown): ReflectProvider[] {
  assert(!!m);
  const config: ReflectModuleConfiguration = (m as any)[Symbol.for('@ajs:rmd')];
  if (!config) {
    throw new TypeError(`object ${m} is not a module`);
  }

  return config.providers;
}

export function getProviderName<T>(
  providerType: ReflectProvider<T>['provide'],
): string {
  assert(!!providerType);
  return typeof providerType === 'string'
    ? providerType
    : providerType.__providerName ?? providerType.name;
}
