import type { AnnotationTarget, DecoratorType } from '@aspectjs/common';
import type { AspectType } from '../../aspect/aspect.type';
import type { Weaver } from '../weaver';

export class JitWeaver implements Weaver {
  enable(): this {
    throw new Error('Method not implemented.');
  }
  disable(..._aspects: (string | object)[]): this {
    throw new Error('Method not implemented.');
  }
  setEnabled(_aspect: AspectType, _enabled: boolean): this {
    throw new Error('Method not implemented.');
  }
  getAspect<T extends AspectType>(
    _aspect: string | (new () => T),
  ): T | undefined {
    throw new Error('Method not implemented.');
  }
  getAspects(): AspectType[] {
    throw new Error('Method not implemented.');
  }
  enhance<T extends DecoratorType>(
    _target: AnnotationTarget<T>,
  ): void | ((...args: unknown[]) => T) | PropertyDescriptor {
    throw new Error('Method not implemented.');
  }
}
