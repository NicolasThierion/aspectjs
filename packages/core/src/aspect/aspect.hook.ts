import {
  AnnotationFactoryHook,
  AspectError,
  DecoratorTargetArgs,
  DecoratorType,
} from '@aspectjs/common';
import { assert } from '@aspectjs/common/utils';
import type { ConstructorType } from 'packages/common/src/constructor.type';
import type { AspectOptions } from './aspect-options.type';
import { Aspect } from './aspect.annotation';
import type { AspectContext } from './aspect.context';
import type { AspectType } from './aspect.type';

export const REGISTER_ASPECT_HOOK = (
  context: AspectContext,
): AnnotationFactoryHook => {
  const targetFactory = context.get('annotationTargetFactory');
  const annotationRegistry = context.get('annotationRegistry');
  const aspectRegistry = context.get('aspectRegistry');

  let globalAspectId = 0;
  return {
    decorator: (annotation, annotationArgs, _annotationStub) => {
      return (...targetArgs: unknown[]) => {
        if (annotation !== Aspect) {
          // nothing to do with this annotation
          return;
        }
        const target = targetFactory.get<DecoratorType.CLASS, any>(
          DecoratorTargetArgs.of(targetArgs),
        );

        const aspect = target.proto.constructor;
        const options = coerceAspectOptions(aspect, annotationArgs[0]);
        assert(target.type === DecoratorType.CLASS);
        if (aspectRegistry.isAspect(aspect)) {
          throw new AspectError(
            `${annotationRegistry
              .find(Aspect)
              .onClass(
                target.declaringClass.proto.constructor,
              )} already exists`,
          );
        }
        aspectRegistry.register(aspect, {
          ...options,
          id: options.id,
        });
      };
    },
    name: '@aspectjs::hook:registerAspect',
  };

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
};
