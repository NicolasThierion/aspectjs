import { ReflectContext, ReflectContextModule } from '@aspectjs/common';
import { setDebug } from '@aspectjs/common/utils';

export const configureReflectTestingContext = (
  ...modules: ReflectContextModule[]
) => {
  setDebug(true);

  return ReflectContext.configureTesting(modules).bootstrap();
};
