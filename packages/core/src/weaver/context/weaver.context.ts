import { ReflectContext, ReflectModule } from '@aspectjs/common';
import { ASPECT_PROVIDERS } from '../../public_api';
import { JIT_WEAVER_PROVIDERS } from '../jit/jit-weaver.provider';

export class WeaverContext extends ReflectContext {}

export class WeaverModule implements ReflectModule {
  providers = [...JIT_WEAVER_PROVIDERS, ...ASPECT_PROVIDERS];
}
