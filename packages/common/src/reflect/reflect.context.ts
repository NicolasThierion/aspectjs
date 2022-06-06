/**
 * Returns an object to store global values across the framework
 */

import type { ReflectProvider } from './reflect-provider.type';
import type { ReflectModule } from './reflect.module';

export class ReflectContext {
  private readonly providersToResolve: Map<
    ReflectProvider['provide'],
    ReflectProvider[]
  >;

  private readonly providersRegistry: Map<string, unknown>;

  constructor(context?: ReflectContext) {
    this.providersToResolve = context?.providersToResolve ?? new Map();
    this.providersRegistry = context?.providersRegistry ?? new Map();
  }

  addModules(...modules: ReflectModule[]): ReflectContext {
    Object.values(modules)
      .flatMap((m) => m.providers)
      .forEach((p) => {
        const providerName = getProviderName(p.provide);
        this.providersToResolve.set(
          providerName,
          (this.providersToResolve.get(providerName) ?? []).concat(p),
        );
      }, new Map<string, ReflectProvider[]>());

    return this;
  }

  get<T>(provider: ReflectProvider<T>['provide']): T {
    return (this.providersRegistry.get(getProviderName(provider)) ??
      this._resolveProvider(provider)) as T;
  }

  has<T>(providerType: ReflectProvider<T>['provide']): boolean {
    return !!this.get(providerType);
  }

  protected _reset() {
    this.providersRegistry.clear();
    this.providersToResolve.clear();
  }

  private _resolveProvider<T>(
    providerType: ReflectProvider<T>['provide'],
    neededBy: string[] = [],
    resolveFirst = false,
  ): T {
    const providerName = getProviderName(providerType);
    const providers = this.providersToResolve.get(providerName);
    // if provider not found
    if (!providers?.length) {
      throw new Error(
        `No ReflectContext provider found for ${providerName}${
          neededBy?.length ? `. Needed by ${neededBy.join(' -> ')}` : ''
        }`,
      );
    }

    let component: any;

    while (providers?.length) {
      const provider = providers.shift()!; // remove p from the resolution list
      // if provider has no deps
      if (!provider.deps?.length) {
        component = provider.factory();
        this.providersRegistry.set(providerName, component);

        if (resolveFirst) {
          return component;
        }
        continue;
      }

      const deps: any[] = provider.deps.map((dep) => {
        // provider already resolved ?
        const depName = getProviderName(dep);
        if (this.providersRegistry.get(depName)) {
          return this.providersRegistry.get(depName);
        }

        try {
          neededBy.push(providerName);
          const dependencyComponent = this._resolveProvider(
            dep,
            neededBy,
            true,
          );
          this.providersRegistry.set(depName, dependencyComponent);
          return dependencyComponent;
        } finally {
          neededBy.pop();
        }
      });

      component = provider.factory(...deps);
      this.providersRegistry.set(providerName, component);

      if (resolveFirst) {
        return component;
      }
    }

    this.providersToResolve?.delete(providerName);
    return component;
  }
}

function getProviderName<T>(
  providerType: ReflectProvider<T>['provide'],
): string {
  return typeof providerType === 'string'
    ? providerType
    : providerType.__providerName ?? providerType.name;
}
