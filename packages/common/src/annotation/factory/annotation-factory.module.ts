import type { ReflectContext } from '../../reflect/reflect.context';
import type { ReflectContextModule } from '../../reflect/reflect-context-module.type';
import { _AnnotationFactoryHooksRegistry } from './annotations-hooks.registry';
import { CALL_ANNOTATION_STUB } from './hooks/call-annotation-stub.hook';

/**
 * @internal
 */
export class _AnnotationsFactoryHooksRegistryModule
  implements ReflectContextModule
{
  order = 0;
  bootstrap(context: ReflectContext): void {
    context.set(
      'annotationFactoryHooksRegistry',
      new _AnnotationFactoryHooksRegistry().add(CALL_ANNOTATION_STUB),
    );
  }
}
