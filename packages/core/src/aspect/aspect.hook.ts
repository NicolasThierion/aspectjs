import {
  AnnotationFactoryHook,
  DecoratorTargetArgs,
  DecoratorType,
} from '@aspectjs/common';
import { assert } from '@aspectjs/common/utils';
import type { AnnotationTargetFactory } from 'packages/common/src/annotation/target/annotation-target.factory';
import type { ConstructorType } from 'packages/common/src/constructor.type';
import type { AspectOptions } from './aspect-options.type';
import { _markAsAspect } from './aspect-utils';
import { Aspect } from './aspect.annotation';
import type { AspectRegistry } from './aspect.registry';
import type { AspectType } from './aspect.type';

export const REGISTER_ASPECT_HOOK = (
  registry: AspectRegistry,
  targetFactory: AnnotationTargetFactory,
): AnnotationFactoryHook => {
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
        _markAsAspect(aspect, {
          ...options,
          id: options.id,
        });
        registry.register({
          aspect,
          options,
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
