import {
  AnnotationRegistry,
  AnnotationTargetFactory,
  ReflectProvider,
} from '@aspectjs/common';

import { AdviceSorter } from '../advice/advice-sort';
import { AdviceRegistry } from '../advice/registry/advice.registry';
import { WeaverContext } from '../weaver/context/weaver.context';
import { AspectRegistry } from './aspect.registry';

/**
 * @internal
 */
export const ASPECT_PROVIDERS: ReflectProvider[] = [
  {
    provide: AspectRegistry,
    deps: [WeaverContext],
    factory: (weaverContext: WeaverContext) => {
      return new AspectRegistry(weaverContext);
    },
  },
  {
    provide: AdviceRegistry,
    deps: [WeaverContext, AdviceSorter],
    factory: (weaverContext: WeaverContext, adviceSort: AdviceSorter) => {
      return new AdviceRegistry(weaverContext, adviceSort);
    },
  },
  {
    provide: AdviceSorter,
    deps: [AnnotationRegistry, AnnotationTargetFactory],
    factory: (
      annotationRegistry: AnnotationRegistry,
      annotationTargetFactory: AnnotationTargetFactory,
    ) => {
      return new AdviceSorter(annotationRegistry, annotationTargetFactory);
    },
  },
];
