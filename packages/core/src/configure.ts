import { reflectContext } from '@aspectjs/common';
import { AspectModule } from './public_api';

export const configureAspectContext = () => {
  return reflectContext().addModules(new AspectModule());
};
