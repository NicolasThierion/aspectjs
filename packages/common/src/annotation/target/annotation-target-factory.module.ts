import type { ReflectContext } from '../../reflect/reflect.context';
import type { ReflectContextModule } from '../../reflect/reflect-context-module.type';
import { AnnotationTargetFactory } from './annotation-target.factory';

export class _AnnotationTargetFactoryModule implements ReflectContextModule {
  name = 'aspectjs:annotationTargetFactoryModule';
  order = 20;
  bootstrap(context: ReflectContext): void {
    context.set('annotationTargetFactory', new AnnotationTargetFactory());
  }
}
