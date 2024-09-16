import { ReflectProvider } from './reflect-provider.type';

(globalThis as any).__aspectjs_global_runtime_instance = 0;
/**
 * @internal
 */ export class __RuntimeState {
  instanceId = (globalThis as any).__aspectjs_global_runtime_instance++; // will be incremented again next time configureTesting() is called
}

export const RUNTIME_STATE_PROVIDER: ReflectProvider = {
  provide: __RuntimeState,
  factory: () => {
    return new __RuntimeState();
  },
};
