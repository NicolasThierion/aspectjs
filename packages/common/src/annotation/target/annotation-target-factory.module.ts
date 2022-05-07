import type { ReflectContext } from '../../reflect/context';
import type { ReflectContextModule } from '../../reflect/reflect-context-module.type';
import { AnnotationTargetFactory } from './annotation-target.factory';

export class AnnotationTargetFactoryModule implements ReflectContextModule {
  order = 20;
  bootstrap(context: ReflectContext): void {
    context.set('annotationTargetFactory', new AnnotationTargetFactory());
  }
}
