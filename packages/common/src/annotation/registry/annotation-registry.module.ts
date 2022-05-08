import type { ReflectContext } from '../../reflect/reflect.context';
import type { ReflectContextModule } from '../../reflect/reflect-context-module.type';
import { AnnotationRegistry } from './annotation.registry';
import { REGISTER_ANNOTATION_HOOK } from './hooks/register-annotation.hook';

export class _AnnotationRegistryModule implements ReflectContextModule {
  order = 100;
  bootstrap(context: ReflectContext): void {
    const targetFactory = context.get('annotationTargetFactory');
    const annotationRegistry = new AnnotationRegistry(targetFactory);
    context
      .get('annotationFactoryHooksRegistry')
      .add(REGISTER_ANNOTATION_HOOK(targetFactory, annotationRegistry));

    context.set('annotationRegistry', annotationRegistry);
  }
}
