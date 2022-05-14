import type { ReflectContextModule } from '@aspectjs/common';
import { AspectModule } from '@aspectjs/core';
import { configureReflectTestingContext } from '@aspectjs/common/testing';

export const configureAspectTestingContext = (
  ...modules: ReflectContextModule[]
) => {
  return configureReflectTestingContext(new AspectModule(), ...modules);
};
