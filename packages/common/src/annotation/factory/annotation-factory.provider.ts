import { DecoratorProviderRegistry } from './decorator-provider.registry';
import { CALL_ANNOTATION_STUB } from './hooks/call-annotation-stub.provider';

import type { ReflectProvider } from '../../reflect/reflect-provider.type';
import { AnnotationType } from '../annotation.types';
import { DecoratorProvider } from './decorator-provider.type';

export const SETUP_BASE_CANVAS_DECORATOR_PROVIDER: DecoratorProvider = {
  name: 'ajs::hook.baseCanvas',
  order: -120,
  createDecorator: (context) => {
    return (...targetArgs: any[]) => {
      if (context.target.type === AnnotationType.CLASS) {
        return function XXX(this: any, ...args: any[]) {
          context.target.constructor.apply(this, ...args);
        };
      }

      return;
    };
  },
};

/**
 * @internal
 */
export const ANNOTATION_HOOK_REGISTRY_PROVIDERS: ReflectProvider[] = [
  {
    provide: DecoratorProviderRegistry,
    factory: () => {
      return (
        new DecoratorProviderRegistry()
          // .add(SETUP_BASE_CANVAS_DECORATOR_PROVIDER)
          .add(CALL_ANNOTATION_STUB)
      );
    },
  },
];
