import { ReflectContext, ReflectContextModule } from '@aspectjs/common';
import { setDebug } from '@aspectjs/common/utils';

export const configureTestingContext = (providers?: ReflectContextModule[]) => {
  setDebug(true);

  return ReflectContext.configureTesting(providers).bootstrap();
};
