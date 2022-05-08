import type { ReflectContext } from './reflect.context';

export interface ReflectContextModule {
  order?: number;
  bootstrap(context: ReflectContext): void;
}
