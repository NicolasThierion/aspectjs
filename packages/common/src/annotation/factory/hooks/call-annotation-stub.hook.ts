import type { DecoratorHook } from '../decorator-hook.type';

export const CALL_ANNOTATION_STUB: DecoratorHook = {
  name: '@aspectjs::hook.annotationStub',
  order: 0,
  createDecorator: (_reflect, context, annotationStub) => {
    return annotationStub(...context.args);
  },
};
