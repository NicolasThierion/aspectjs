import { ReflectContext } from './reflect.context';

let _context = new ReflectContext();

export const reflectContext = () => {
  return _context;
};

export const _setReflectContext = (context: ReflectContext) =>
  (_context = context);
