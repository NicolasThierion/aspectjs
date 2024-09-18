import { ConstructorType } from '../types.util';

export interface AbstractToken<T = unknown> {
  readonly template?: T | ConstructorType<T>;
}
