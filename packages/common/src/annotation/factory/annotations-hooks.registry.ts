import { assert } from '@aspectjs/common/utils';
import type { ReflectContextModule } from '../../reflect/reflect-context-module.type';
import type { AnnotationsHook } from './annotations-hook';
import { CALL_ANNOTATION_STUB } from './hooks/call-annotation-stub.hook';

/**
 * @internal
 */
export class AnnotationsHooksRegistry {
  protected readonly hooks: Map<string, AnnotationsHook> = new Map();

  values() {
    return this.hooks.values();
  }

  add(annotationsHook: AnnotationsHook) {
    assert(!!annotationsHook.name);
    this.hooks.set(annotationsHook.name, annotationsHook);
    return this;
  }
}

/**
 * @internal
 */
export class AnnotationsHooksModule
  implements ReflectContextModule<AnnotationsHooksRegistry>
{
  order = 0;
  bootstrap(): AnnotationsHooksRegistry {
    return new AnnotationsHooksRegistry().add(CALL_ANNOTATION_STUB);
  }
}
