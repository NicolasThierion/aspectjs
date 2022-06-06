import { assert } from '@aspectjs/common/utils';
import type { AnnotationFactoryHook } from './annotation-factory-hook.type';

/**
 * @internal
 */
export class _AnnotationFactoryHookRegistry {
  protected readonly hooks: Map<string, AnnotationFactoryHook> = new Map();

  static readonly __providerName = 'AnnotationFactoryHookRegistry';
  values() {
    return this.hooks.values();
  }

  add(annotationsHook: AnnotationFactoryHook) {
    assert(!!annotationsHook.name);
    assert(!this.hooks.has(annotationsHook.name));
    this.hooks.set(annotationsHook.name, annotationsHook);
    return this;
  }
}
