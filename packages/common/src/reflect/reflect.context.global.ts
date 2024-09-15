import { ReflectContext } from './reflect.context';

/**
 * Get the reflect context.
 * @internal
 * @returns The reflect context.
 */
export const reflectContext = () => {
  return (globalThis as any).__reflectContext as ReflectContext;
};

/**
 * @internal
 * Replace the current reflect context. Internally called by {@link ./../../testing/src/setup#configureTesting}
 * @param context
 * @returns
 */
export const _setReflectContext = (context: ReflectContext) =>
  ((globalThis as any).__reflectContext = context);

_setReflectContext(reflectContext() ?? new ReflectContext());
