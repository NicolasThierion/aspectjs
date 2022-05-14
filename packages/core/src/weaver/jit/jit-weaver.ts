import type { AnnotationTarget, DecoratorType } from '@aspectjs/common';
import type { AspectType } from '../../aspect/aspect.type';
import type { Weaver } from '../weaver';

export class JitWeaver implements Weaver {
  enable(): this {
    throw new Error('Method not implemented.');
  }
  disable(...aspects: (string | object)[]): this {
    throw new Error('Method not implemented.');
  }
  setEnabled(aspect: AspectType, enabled: boolean): this {
    throw new Error('Method not implemented.');
  }
  getAspect<T extends AspectType>(
    aspect: string | (new () => T),
  ): T | undefined {
    throw new Error('Method not implemented.');
  }
  getAspects(): AspectType[] {
    throw new Error('Method not implemented.');
  }
  enhance<T extends DecoratorType>(
    target: AnnotationTarget<T>,
  ): void | Function | PropertyDescriptor {
    throw new Error('Method not implemented.');
  }
}
