import {
  AnnotationContext,
  AnnotationRegistry,
  annotationsContext,
  AnnotationTrigger,
  AspectError,
  TargetType,
} from '@aspectjs/common';
import { assert, ConstructorType } from '@aspectjs/common/utils';
import type { AspectOptions } from './aspect-options.type';
import { Aspect } from './aspect.annotation';
import { AspectRegistry } from './aspect.registry';
import type { AspectType } from './aspect.type';

export const REGISTER_ASPECT_TRIGGER: AnnotationTrigger = {
  annotations: [Aspect.ref],
  order: 50,
  targets: [TargetType.CLASS],
  fn: (annotation: AnnotationContext<TargetType.CLASS>) => {
    const context = annotationsContext();
    const aspectRegistry = context.get(AspectRegistry);
    const annotationRegistry = context.get(AnnotationRegistry);
    const target = annotation.target;

    const aspect = target.proto.constructor;
    const options = coerceAspectOptions(aspect, annotation.args[0]);
    assert(target.type === TargetType.CLASS);
    if (aspectRegistry.isAspect(aspect)) {
      throw new AspectError(
        `${annotationRegistry
          .find(Aspect)
          .onClass(target.declaringClass.proto.constructor)} already exists`,
      );
    }
    aspectRegistry.register(aspect, {
      ...options,
      id: options.id,
    });
  },
};

let globalAspectId = 0;

function coerceAspectOptions(
  aspectCtor: ConstructorType<AspectType>,
  idOrOptions: unknown,
): Required<AspectOptions> {
  const options: AspectOptions =
    typeof idOrOptions === 'object' ? { ...idOrOptions } : {};

  options.id =
    typeof idOrOptions === 'string'
      ? idOrOptions
      : options.id ?? `${aspectCtor.name}#${globalAspectId++}`;
  return options as Required<AspectOptions>;
}
