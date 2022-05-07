import type { ReflectContextModule } from '../../reflect/reflect-context-module.type';
import { _AnnotationFactoryHooksRegistry } from './annotations-hooks.registry';
import { CALL_ANNOTATION_STUB } from './hooks/call-annotation-stub.hook';

/**
 * @internal
 */
export class _AnnotationsFactoryHooksRegistryModule
  implements ReflectContextModule<_AnnotationFactoryHooksRegistry>
{
  order = 0;
  bootstrap(): _AnnotationFactoryHooksRegistry {
    return new _AnnotationFactoryHooksRegistry().add(CALL_ANNOTATION_STUB);
  }
}
