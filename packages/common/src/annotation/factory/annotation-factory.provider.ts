import type { ReflectProvider } from '../../reflect/reflect-provider.type';
import { _AnnotationFactoryHookRegistry } from './annotations-hooks.registry';
import { CALL_ANNOTATION_STUB } from './hooks/call-annotation-stub.hook';

/**
 * @internal
 */
export const ANNOTATION_HOOK_REGISTRY_PROVIDERS: ReflectProvider[] = [
  {
    provide: _AnnotationFactoryHookRegistry,
    factory: () => {
      return new _AnnotationFactoryHookRegistry().add(CALL_ANNOTATION_STUB);
    },
  },
];
