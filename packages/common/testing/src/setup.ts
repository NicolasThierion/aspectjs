import { ReflectContext, ReflectContextModules } from '@aspectjs/common';
import { setDebug } from '@aspectjs/common/utils';

export const configureTestingContext = (
  deps?: Partial<ReflectContextModules>
) => {
  setDebug(true);

  return ReflectContext.configureTesting(deps).bootstrap();
};
