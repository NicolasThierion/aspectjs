import type { ReflectContextModule } from '../../reflect/reflect-context-module.type';
import type { ReflectContext } from '../../reflect/reflect.context';
import { AnnotationTriggerRegistry } from './annotation-trigger.registry';
import { CALL_ANNOTATION_TRIGGERS } from './annotation-trigger.hook';

export class _AnnotationTriggerModule implements ReflectContextModule {
  readonly name = 'aspectjs:annotationTriggerRegistryModule';
  bootstrap(context: ReflectContext): void {
    const triggerReg = new AnnotationTriggerRegistry();
    context.set('annotationTriggerRegistry', triggerReg);
    context
      .get('annotationFactoryHooksRegistry')
      .add(CALL_ANNOTATION_TRIGGERS(context));
  }
}
