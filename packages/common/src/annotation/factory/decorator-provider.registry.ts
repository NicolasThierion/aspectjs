import { assert } from '@aspectjs/common/utils';

import type { DecoratorProvider } from './decorator-provider.type';

/**
 * @internal
 */
export class DecoratorProviderRegistry {
  protected readonly hooks: Map<string, DecoratorProvider> = new Map();

  static readonly __providerName = 'DecoatorProviderRegistry';
  values() {
    return this.hooks.values();
  }

  add(annotationsHook: DecoratorProvider) {
    assert(!!annotationsHook.name);
    assert(!this.hooks.has(annotationsHook.name));
    this.hooks.set(annotationsHook.name, annotationsHook);
    return this;
  }
}
