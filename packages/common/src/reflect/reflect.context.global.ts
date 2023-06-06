import { ReflectContext } from './reflect.context';

let _context = new ReflectContext();

/**
 * Get the reflect context.
 * @internal
 * @returns The reflect context.
 */
export const reflectContext = () => {
  return _context;
};

/**
 * @internal
 * Replace the current reflect context. Internally called by {@link ./../../testing/src/setup#configureTesting}
 * @param context
 * @returns
 */
export const _setReflectContext = (context: ReflectContext) =>
  (_context = context);
