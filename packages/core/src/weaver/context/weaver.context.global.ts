import { annotationsContext } from '@aspectjs/common';

import { WeaverModule } from './weaver.module';

import type { WeaverContext } from './weaver.context';
export const weaverContext = (): WeaverContext => {
  return annotationsContext().addModules(new WeaverModule());
};
