import { assert, ConstructorType } from '@aspectjs/common/utils';

/**
 * Returns an object to store global values across the framework
 */

import type { ReflectProvider } from './reflect-provider.type';
import type { ReflectModule } from './reflect.module';

/**
 * @internal
 *
 * @description The ReflectContext is a container for the global values and services of the framework.
 * The services are added to the context in the form of {@link ReflectProvider}s,
 * through the use of {@link ReflectModule}s.
 */
export class ReflectContext {
  private readonly providersToResolve: Map<string, ReflectProvider[]> =
    new Map();

  private readonly providersRegistry: Map<string, unknown> = new Map();
  private readonly addedProviders: Set<ReflectProvider> = new Set();
  protected readonly modules: Set<ConstructorType<ReflectModule>> = new Set();

  /**
   * @internal
   * @param context
   */
  constructor(context?: ReflectContext) {
    this.providersToResolve = new Map(context?.providersToResolve);
    this.providersRegistry = new Map(context?.providersRegistry);
    this.addedProviders = new Set(context?.addedProviders);
    this.modules = new Set(context?.modules);
  }

  /**
   * Adds a module to the context. Modules are unique by their name.
   * Adding the same module twice has no effect.
   * @param module The module to add
   */
  addModules(...modules: ConstructorType<ReflectModule>[]): ReflectContext {
    // dedupe modules
    modules = [...new Set(modules).values()].filter(
      (m) => !this.modules.has(m),
    );

    const moduleInstances = modules.map((m) => new m());

    const providers = moduleInstances.flatMap((m) => m.providers);

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

  /**
   * Get a provider by its name or type.
   * @param provider The provider name or type.
   * @param T the provider type
   * @return The provider, if registered, undefined otherwise.
   */
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

  /**
   * Know if a provider is registered.
   * @param providerType The provider name or type.
   * @param T the provider type
   * @returns true if the provider is registered, false otherwise.
   */
  has<T>(providerType: ReflectProvider<T>['provide']): boolean {
    return !!this.get(providerType);
  }

  protected reset() {
    this.modules.clear();
    this.addedProviders.clear();
    this.providersRegistry.clear();
    this.providersToResolve.clear();
  }
  protected apply(context: ReflectContext) {
    context.modules.forEach((m) => this.modules.add(m));
    context.addedProviders.forEach((p) => this.addedProviders.add(p));

    context.providersRegistry.forEach((provider, name) =>
      this.providersRegistry.set(name, provider),
    );

    context.providersToResolve.forEach((p, n) => {
      this.providersToResolve.set(n, [...p]);
    });

    return this;
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

    this.providersToResolve.delete(providerName);
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
