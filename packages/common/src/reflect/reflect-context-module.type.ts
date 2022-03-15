import type { ReflectContext } from './context';

export interface ReflectContextModule<T> {
  order?: number;
  bootstrap(context: ReflectContext): T;
}
