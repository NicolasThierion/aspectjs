import {
  ReflectProvider,
  _AnnotationFactoryHookRegistry,
} from '@aspectjs/common';
import { JitWeaver } from './jit-weaver';
import { CALL_JIT_WEAVER_HOOK } from './jit-weaver.hook';

// TODO test
export const JIT_WEAVER_PROVIDERS: ReflectProvider[] = [
  {
    provide: JitWeaver,
    factory: () => new JitWeaver(),
  },
  {
    provide: _AnnotationFactoryHookRegistry,
    deps: [_AnnotationFactoryHookRegistry],

    factory: (annotationHookRegistry: _AnnotationFactoryHookRegistry) => {
      return annotationHookRegistry.add(CALL_JIT_WEAVER_HOOK());
    },
  } as ReflectProvider<_AnnotationFactoryHookRegistry>,
];
