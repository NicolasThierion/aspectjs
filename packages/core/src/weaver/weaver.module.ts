import type { ReflectContext, ReflectContextModule } from '@aspectjs/common';
import { CALL_JIT_WEAVER_HOOK } from './jit/jit-weaver.hook';
import type { JitWeaver } from './jit/jit-weaver';

declare module '@aspectjs/common' {
  interface KnownReflectContextProviders {
    weaver: JitWeaver;
  }
}

export class AspectModule implements ReflectContextModule {
  readonly name = 'aspectjs:aspectModule';
  readonly order?: number | undefined;
  bootstrap(context: ReflectContext): void {
    context.get('annotationFactoryHooksRegistry').add(CALL_JIT_WEAVER_HOOK());
  }
}
