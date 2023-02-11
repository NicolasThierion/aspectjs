import { AnnotationTargetFactory } from '../target/annotation-target.factory';
import { _AnnotationFactoryHookRegistry } from './../factory/annotations-hooks.registry';
import { AnnotationRegistry } from './annotation.registry';
import { REGISTER_ANNOTATION_HOOK } from './hooks/register-annotation.hook';

import type { ReflectProvider } from '../../reflect/reflect-provider.type';
/**
 * @internal
 */
export const ANNOTATION_REGISTRY_PROVIDERS: ReflectProvider[] = [
  {
    provide: AnnotationRegistry,
    deps: [AnnotationTargetFactory],
    factory: (targetFactory: AnnotationTargetFactory) => {
      return new AnnotationRegistry(targetFactory);
    },
  },
  {
    provide: _AnnotationFactoryHookRegistry,
    deps: [
      AnnotationRegistry,
      AnnotationTargetFactory,
      _AnnotationFactoryHookRegistry,
    ],
    factory: (
      annotationRegistry: AnnotationRegistry,
      targetFactory: AnnotationTargetFactory,
      annotationFactoryHookRegistry: _AnnotationFactoryHookRegistry,
    ) => {
      return annotationFactoryHookRegistry.add(
        REGISTER_ANNOTATION_HOOK(targetFactory, annotationRegistry),
      );
    },
  },
];
