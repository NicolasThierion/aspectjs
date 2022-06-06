import { AnnotationTriggerRegistry, ReflectProvider } from '@aspectjs/common';
import { AdviceRegistry } from '../advice/advice.registry';
import { REGISTER_ADVICE_TRIGGER } from '../advice/advice.trigger';
import { REGISTER_ASPECT_TRIGGER } from './aspect.hook';
import { AspectRegistry } from './aspect.registry';

export const ASPECT_PROVIDERS: ReflectProvider[] = [
  {
    provide: AspectRegistry,
    factory: () => {
      return new AspectRegistry();
    },
  },
  {
    provide: AdviceRegistry,
    factory: () => {
      return new AdviceRegistry();
    },
  },
  {
    provide: AnnotationTriggerRegistry,
    deps: [AnnotationTriggerRegistry],
    factory: (annotationTriggerRegistry: AnnotationTriggerRegistry) => {
      return annotationTriggerRegistry
        .add(REGISTER_ASPECT_TRIGGER)
        .add(REGISTER_ADVICE_TRIGGER);
    },
  },
];
