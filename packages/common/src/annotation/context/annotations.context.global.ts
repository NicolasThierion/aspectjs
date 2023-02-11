import { ANNOTATION_HOOK_REGISTRY_PROVIDERS } from '../factory/annotation-factory.provider';
import { ANNOTATION_REGISTRY_PROVIDERS } from '../registry/annotation-registry.provider';
import { ANNOTATION_TARGET_FACTORY_PROVIDERS } from '../target/annotation-target-factory.provider';
import { ANNOTATION_TRIGGER_PROVIDERS } from '../trigger/annotation-trigger.provider';

import { reflectContext } from '../../reflect/reflect.context.global';
import type { ReflectModule } from '../../reflect/reflect.module';

export class AnnotationsReflectModule implements ReflectModule {
  providers = [
    ...ANNOTATION_REGISTRY_PROVIDERS,
    ...ANNOTATION_HOOK_REGISTRY_PROVIDERS,
    ...ANNOTATION_TARGET_FACTORY_PROVIDERS,
    ...ANNOTATION_TRIGGER_PROVIDERS,
  ];
}

export const annotationsContext = () => {
  return reflectContext().addModules(new AnnotationsReflectModule());
};
