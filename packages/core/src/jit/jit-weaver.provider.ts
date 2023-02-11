import {
  _AnnotationFactoryHookRegistry,
  AnnotationTargetFactory,
  ReflectProvider,
} from '@aspectjs/common';

import { WeaverContext } from '../weaver/context/weaver.context';
import { weaverContext } from './../weaver/context/weaver.context.global';
import { JitWeaver } from './jit-weaver';
import { CALL_JIT_WEAVER_HOOK } from './jit-weaver.hook';
import { JoinPointFactory } from './joinpoint.factory';

// TODO test
export const JIT_WEAVER_PROVIDERS: ReflectProvider[] = [
  {
    provide: WeaverContext,
    factory: () => weaverContext(),
  },
  {
    provide: JitWeaver,
    deps: [WeaverContext],
    factory: (weaverContext: WeaverContext) => new JitWeaver(weaverContext),
  } as any,
  {
    provide: _AnnotationFactoryHookRegistry,
    deps: [_AnnotationFactoryHookRegistry, AnnotationTargetFactory],

    factory: (
      annotationHookRegistry: _AnnotationFactoryHookRegistry,
      targetFactory: AnnotationTargetFactory,
    ) => {
      return annotationHookRegistry.add(CALL_JIT_WEAVER_HOOK(targetFactory));
    },
  },
  {
    provide: JoinPointFactory,
    factory: () => new JoinPointFactory(),
  },
];
