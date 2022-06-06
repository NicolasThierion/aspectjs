import {
  ReflectContext,
  ReflectModule,
  _setReflectContext,
} from '@aspectjs/common';
import { setDebug } from '@aspectjs/common/utils';

export class ReflectTestingContext extends ReflectContext {
  public reset() {
    super._reset();
    return this;
  }
}

export const configureTesting = <T extends ReflectModule = ReflectModule>(
  context?: ReflectContext,
) => {
  setDebug(true);
  const c = new ReflectTestingContext(context);
  _setReflectContext(c);

  // c.bootstrap();
  return c as ReflectTestingContext & T;
};
