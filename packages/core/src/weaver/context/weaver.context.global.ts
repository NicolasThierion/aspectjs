import { WeaverModule } from '../weaver.module';

import { reflectContext } from '@aspectjs/common';
import { JitWeaver } from '../../jit/jit-weaver';
import { Weaver } from '../weaver';
import type { WeaverContext } from './weaver.context';

// force WeaverModule to add its annotation hooks even before getting called
// to take a chance to compile annotated symbols even when weaverContext is called lately
reflectContext().registerModules(WeaverModule);

/**
 * @internal
 */
export const weaverContext = (): WeaverContext => {
  return reflectContext().registerModules(WeaverModule);
};

/**
 * Get the weaver instance.
 *
 * @returns {Weaver} The weaver instance.
 */
export function getWeaver(): Weaver {
  return weaverContext().get(JitWeaver);
}
