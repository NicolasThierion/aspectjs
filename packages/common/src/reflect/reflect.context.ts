import { assert, ConstructorType } from '@aspectjs/common/utils';

/**
 * Returns an object to store global values across the framework
 */

import { getProviderName, getProviders } from '../../utils/src/module.utils';
import { ANNOTATION_CONTEXT_REGISTRY_PROVIDERS } from '../annotation/context/registry/annotation-context-registry.provider';
import { ANNOTATION_HOOK_REGISTRY_PROVIDERS } from '../annotation/factory/annotation-factory.provider';
import { ANNOTATION_REGISTRY_PROVIDERS } from '../annotation/registry/annotation-registry.provider';
import { ANNOTATION_TARGET_FACTORY_PROVIDERS } from '../annotation/target/annotation-target-factory.provider';
import { ReflectModule } from './module/reflect-module.type';
import type { ReflectProvider } from './reflect-provider.type';
import { RUNTIME_STATE_PROVIDER } from './runtime-state.provider';

@ReflectModule({
  providers: [
    RUNTIME_STATE_PROVIDER,
    ...ANNOTATION_REGISTRY_PROVIDERS,
    ...ANNOTATION_CONTEXT_REGISTRY_PROVIDERS,
    ...ANNOTATION_HOOK_REGISTRY_PROVIDERS,
    ...ANNOTATION_TARGET_FACTORY_PROVIDERS,
  ],
})
class AnnotationsModule {}

const DEFAULT_MODULES = [AnnotationsModule];
/**
 * @internal
 *
 * @description The ReflectContext is a container for the global values and services of the framework.
 * The services are added to the context in the form of {@link ReflectProvider}s,
 * through the use of {@link ReflectModuleConfiguration}s.
 */
export class ReflectContext {
  protected providersToResolve: Map<string, ReflectProvider[]> = new Map();

  protected providersRegistry: Map<
    string,
    { component: unknown; provider: ReflectProvider }[]
  > = new Map();
  protected addedProviders: Set<ReflectProvider> = new Set();
  protected modules: Set<ConstructorType> = new Set();

  /**
   * @internal
   * @param context
   */
  constructor(context?: ReflectContext) {
    this.providersToResolve = new Map(context?.providersToResolve);
    this.providersRegistry = new Map(context?.providersRegistry);
    this.addedProviders = new Set(context?.addedProviders);
    this.modules = new Set(context?.modules);
    this.registerModules(...DEFAULT_MODULES);
  }

  /**
   * Adds a module to the context. Modules are unique by their name.
   * Adding the same module twice has no effect.
   * @param module The module to add
   */
  registerModules(...modules: ConstructorType<unknown>[]): ReflectContext {
    // dedupe modules
    modules = [...new Set(modules).values()].filter(
      (m) => !this.modules.has(m),
    );
    if (!modules.length) {
      return this;
    }

    const providers = modules.flatMap((m) => getProviders(m));

    this.addProviders(providers);
    modules.forEach((m) => this.modules.add(m));
    return this;
  }

  private addProviders(providers: ReflectProvider[]) {
    providers.forEach((p) => {
      const providerName = getProviderName(p.provide);
      this.addedProviders.add(p);
      this.providersToResolve.set(
        providerName,
        (this.providersToResolve.get(providerName) ?? []).concat(p),
      );
    });
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

  private _get<T>(providerName: string, neededBy: string[] = []): T {
    this._tryResolveProvider(providerName, neededBy);
    const candidates = this.providersRegistry.get(providerName);
    const provider = candidates?.[candidates?.length - 1]?.component;

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

  protected assign(context: ReflectContext) {
    assert(!!context);
    this.modules = context.modules;
    this.addedProviders = context.addedProviders;
    this.providersRegistry = context.providersRegistry;
    this.providersToResolve = context.providersToResolve;

    return this;
  }
  private _tryResolveProvider(
    providerType: string,
    neededBy: string[] = [],
  ): void {
    const providerName = getProviderName(providerType);
    const providers = this.providersToResolve.get(providerName);

    let component: unknown;

    while (providers?.length) {
      const provider = providers.shift()!; // remove p from the resolution list
      // if provider has no deps
      if (!provider.deps?.length) {
        component = provider.factory();
      } else {
        const deps: any[] = provider.deps.map((dep) => {
          // provider already resolved ?
          const depName = getProviderName(dep);

          try {
            neededBy.push(providerName);
            return this._get(depName, neededBy);
          } finally {
            neededBy.pop();
          }
        });

        component = provider.factory(...deps);
      }
      this.providersRegistry.set(
        providerName,
        (this.providersRegistry.get(providerName) ?? []).concat({
          component,
          provider,
        }),
      );
    }

    this.providersToResolve.delete(providerName);
  }
}
