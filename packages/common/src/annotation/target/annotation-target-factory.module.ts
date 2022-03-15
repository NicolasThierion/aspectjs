import type { ReflectContext } from '../../reflect/context';
import type { ReflectContextModule } from '../../reflect/reflect-context-module.type';
import { AnnotationTargetFactory } from './annotation-target.factory';

export class AnnotationTargetFactoryModule
  implements ReflectContextModule<AnnotationTargetFactory>
{
  order = 20;
  bootstrap(_context: ReflectContext): AnnotationTargetFactory {
    return new AnnotationTargetFactory();
  }
}
