import { ReflectContext, ReflectContextProviders } from '@aspectjs/common';
import type { AdviceRegistry } from '../advice/advice.registry';
import type { Weaver } from '../weaver/weaver';
import type { AspectRegistry } from './aspect.registry';

declare module '@aspectjs/common' {
  interface KnownReflectContextProviders {
    aspectRegistry: AspectRegistry;
    weaver: Weaver;
    adviceRegistry: AdviceRegistry;
  }
}

export class AspectContext extends ReflectContext {
  protected override providers: ReflectContextProviders =
    {} as ReflectContextProviders;
}
