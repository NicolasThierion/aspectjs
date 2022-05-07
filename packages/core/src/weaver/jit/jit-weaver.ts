import type { AspectType } from '../../aspect/aspect.type';
import type { Weaver } from '../weaver';

export class JitWeaver implements Weaver {
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
  enable(): this {
    return this;
  }
}
