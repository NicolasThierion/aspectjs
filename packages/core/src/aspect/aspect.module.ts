import type { ReflectContextModule } from '@aspectjs/common';
import { AdviceRegistry } from '../advice/advice.registry';
import { REGISTER_ADVICE_HOOK } from '../advice/advice.hook';
import { JitWeaver } from '../weaver/jit/jit-weaver';
import type { AspectContext } from './aspect.context';
import { REGISTER_ASPECT_HOOK } from './aspect.hook';
import { AspectRegistry } from './aspect.registry';

export class AspectModule implements ReflectContextModule {
  readonly name = 'aspectjs:aspectModule';
  readonly order?: number | undefined;
  bootstrap(context: AspectContext): void {
    context.set('aspectRegistry', new AspectRegistry());
    context.set('weaver', new JitWeaver());
    context.set('adviceRegistry', new AdviceRegistry());
    context
      .get('annotationFactoryHooksRegistry')
      .add(REGISTER_ASPECT_HOOK(context))
      .add(REGISTER_ADVICE_HOOK(context));
  }
}
