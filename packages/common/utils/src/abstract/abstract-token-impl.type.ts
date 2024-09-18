import { ConstructorType } from '@aspectjs/common/utils';
import type { AbstractToken } from './abstract-token.type';

export class _AbstractTokenImpl<T = unknown> implements AbstractToken<T> {
  constructor(
    public readonly counter: number,
    public readonly template?: T | ConstructorType<T>,
  ) {}
  toSting() {
    return '[ABSTRACT_TOKEN placeholder]';
  }
}
