import { assert, ConcreteConstructorType } from '@aspectjs/common/utils';
import { AnnotationType } from '../../annotation.types';
import { DecoratorHook } from '../decorator-hook.type';

/**
 * TODO: remove
 * @internal
 */
export const SETUP_JIT_CANVAS_JOOK: DecoratorHook = {
  name: 'ajs::hook.jit-canvas',
  order: -120,
  createDecorator: (_reflect, context) => {
    return (...targetArgs: any[]) => {
      if (context.target.type === AnnotationType.CLASS) {
        assert(targetArgs.length === 1);
        assert(typeof targetArgs[0] === 'function');
        const decoree = function XXX(this: any, ...args: any[]) {
          const compiledSymbol = context.target.getMetadata(
            'ajs.jit-aop-decoree',
            () => {
              return context.target.proto
                .constructor as ConcreteConstructorType;
            },
          );
          return new compiledSymbol(...args);
        };

        return decoree;
      }

      return;
    };
  },
};
