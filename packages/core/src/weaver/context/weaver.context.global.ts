import { reflectContext } from '@aspectjs/common';
import { WeaverContext, WeaverModule } from './weaver.context';

let _context: WeaverContext;
export const weaverContext = (): WeaverContext => {
  if (_context) {
    return _context;
  }
  return (_context = reflectContext().addModules(new WeaverModule()));
};
