import { ConstructorType } from '@aspectjs/common/utils';

export interface AbstractToken<T = unknown> {
  readonly template?: T | ConstructorType<T>;
}
