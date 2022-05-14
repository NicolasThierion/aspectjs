import type { ReflectContext } from './reflect.context';

export interface ReflectContextModule {
  readonly name: string;
  readonly order?: number;
  bootstrap(context: ReflectContext): void;
}
