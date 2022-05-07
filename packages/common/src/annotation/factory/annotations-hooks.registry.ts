import { assert } from '@aspectjs/common/utils';
import type { AnnotationFactoryHook } from './annotation-factory-hook.type';

/**
 * @internal
 */
export class _AnnotationFactoryHooksRegistry {
  protected readonly hooks: Map<string, AnnotationFactoryHook> = new Map();

  values() {
    return this.hooks.values();
  }

  add(annotationsHook: AnnotationFactoryHook) {
    assert(!!annotationsHook.name);
    this.hooks.set(annotationsHook.name, annotationsHook);
    return this;
  }
}
