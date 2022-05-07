import type { ReflectContext } from './context';

export interface ReflectContextModule {
  order?: number;
  bootstrap(context: ReflectContext): void;
}
