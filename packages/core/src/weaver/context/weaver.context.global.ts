import { annotationsContext } from '@aspectjs/common';

import { WeaverModule } from './weaver.module';

import { JitWeaver } from '../../jit/jit-weaver';
import { Weaver } from '../weaver';
import type { WeaverContext } from './weaver.context';

/**
 * @internal
 */
export const weaverContext = (): WeaverContext => {
  return annotationsContext().addModules(WeaverModule);
};

/**
 * Get the weaver instance.
 *
 * @returns {Weaver} The weaver instance.
 */
export function getWeaver(): Weaver {
  return weaverContext().get(JitWeaver);
}
