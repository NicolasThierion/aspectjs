import { assert } from '@aspectjs/common/utils';

import type { DecoratorHook } from './decorator-hook.type';

/**
 * @internal
 */
export class DecoratorHookRegistry {
  protected readonly hooks: Map<string, DecoratorHook> = new Map();

  static readonly __providerName = 'DecoratorHookRegistry';
  values() {
    return this.hooks.values();
  }

  add(annotationsHook: DecoratorHook) {
    assert(!!annotationsHook.name);
    assert(!this.hooks.has(annotationsHook.name));
    this.hooks.set(annotationsHook.name, annotationsHook);
    return this;
  }

  remove(annotationsHook: DecoratorHook | string) {
    const name =
      typeof annotationsHook === 'string'
        ? annotationsHook
        : annotationsHook.name;
    assert(!!name);
    this.hooks.delete(name);
    return this;
  }
}
