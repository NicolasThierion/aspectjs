import { assert } from '@aspectjs/common/utils';

/**
 * Returns an object to store global values across the framework
 */

import type { ReflectProvider } from './reflect-provider.type';
import type { ReflectModule } from './reflect.module';

export class ReflectContext {
  private readonly providersToResolve: Map<
    ReflectProvider['provide'],
    ReflectProvider[]
  > = new Map();

  private readonly providersRegistry: Map<string, unknown> = new Map();
  private readonly modules: Set<ReflectModule> = new Set();
  private addedProviders: Set<ReflectProvider> = new Set();

  constructor(context?: ReflectContext) {
    if (context?.modules) {
      this.addModules(...context.modules.values());
    }
  }

  addModules(...modules: ReflectModule[]): ReflectContext {
    modules = Object.values(modules).filter((m) => !this.modules.has(m));

    // dedupe providers
    const providers = [
      ...new Set(modules.flatMap((m) => m.providers)).values(),
    ].filter((p) => !this.addedProviders.has(p));

    providers.forEach((p) => {
      const providerName = getProviderName(p.provide);
      this.addedProviders.add(p);
      this.providersToResolve.set(
        providerName,
        (this.providersToResolve.get(providerName) ?? []).concat(p),
      );
    }, new Map<string, ReflectProvider[]>());

    Object.values(modules).forEach((m) => !this.modules.add(m));
    return this;
  }

  get<T>(providerType: ReflectProvider<T>['provide']): T {
    return this._get(getProviderName(providerType));
  }

  private _get<T>(
    providerName: string,
    neededBy: string[] = [],
    resolveFirst = false,
  ): T {
    const provider =
      this._tryResolveProvider(providerName, neededBy, resolveFirst) ??
      (this.providersRegistry.get(providerName) as T);

    // if provider not found
    if (!provider) {
      throw new Error(
        `No ReflectContext provider found for ${providerName}${
          neededBy?.length ? `. Needed by ${neededBy.join(' -> ')}` : ''
        }`,
      );
    }

    return provider as T;
  }

  has<T>(providerType: ReflectProvider<T>['provide']): boolean {
    return !!this.get(providerType);
  }

  protected _reset() {
    this.modules.clear();
    this.addedProviders.clear();
    this.providersRegistry.clear();
    this.providersToResolve.clear();
  }

  private _tryResolveProvider<T>(
    providerType: string,
    neededBy: string[] = [],
    resolveFirst = false,
  ): T {
    const providerName = getProviderName(providerType);
    const providers = this.providersToResolve.get(providerName);

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
          const dependencyComponent = this._get(
            depName,
            neededBy,
            depName === providerName, // if a provider depends on itself, only resolve the first matching provider
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
  assert(!!providerType);
  return typeof providerType === 'string'
    ? providerType
    : providerType.__providerName ?? providerType.name;
}
