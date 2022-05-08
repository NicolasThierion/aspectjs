import type { ReflectContextModule, ReflectContext } from '@aspectjs/common';
import { REGISTER_ASPECT_HOOK } from './aspect.hook';
import { AspectRegistry } from './aspect.registry';

declare module '@aspectjs/common' {
  interface KnownReflectContextProviders {
    aspectRegistry: AspectRegistry;
  }
}

export class AspectModule implements ReflectContextModule {
  order?: number | undefined;
  bootstrap(context: ReflectContext): void {
    const reg = new AspectRegistry();

    context.set('aspectRegistry', reg);
    context
      .get('annotationFactoryHooksRegistry')
      .add(REGISTER_ASPECT_HOOK(reg, context.get('annotationTargetFactory')));
    // TODO add REGISTER_ASPECT_HOOK
    // TODO add CALL_WEAVER_HOOK
  }
}
