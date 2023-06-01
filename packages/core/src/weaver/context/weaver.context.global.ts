import { annotationsContext } from '@aspectjs/common';

import { WeaverModule } from './weaver.module';

import { JitWeaver } from '../../jit/jit-weaver';
import { Weaver } from '../weaver';
import type { WeaverContext } from './weaver.context';
export const weaverContext = (): WeaverContext => {
  return annotationsContext().addModules(WeaverModule);
};

export function getWeaver(): Weaver {
  return weaverContext().get(JitWeaver);
}
