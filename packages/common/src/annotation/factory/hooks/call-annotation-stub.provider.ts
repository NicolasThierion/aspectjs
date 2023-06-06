import type { DecoratorProvider } from '../decorator-provider.type';

export const CALL_ANNOTATION_STUB: DecoratorProvider = {
  name: '@aspectjs::annotations.factory-hooks.annotationStub',
  order: 0,
  createDecorator: (_reflect, _annotation, annotationArgs, annotationStub) => {
    return annotationStub(...annotationArgs);
  },
};
