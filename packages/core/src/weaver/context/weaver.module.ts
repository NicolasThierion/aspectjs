import { ASPECT_PROVIDERS } from '../../aspect/aspect.provider';
import { JIT_WEAVER_PROVIDERS } from '../../jit/jit-weaver.provider';

import type { ReflectModule } from '@aspectjs/common';
export class WeaverModule implements ReflectModule {
  providers = [...ASPECT_PROVIDERS, ...JIT_WEAVER_PROVIDERS];
}
