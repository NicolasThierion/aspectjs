import type { AspectType } from '../aspect/aspect.type';

/**
 * A Weaver is some kind of compiler that connects the joinpoints to the corresponding advices.
 * @public
 */
export interface Weaver {
  /**
   * Enable some aspects.
   * @param aspects - the aspects to enable
   */
  enable(...aspects: AspectType[]): this;

  /**
   * Find aspects among enabled aspects given an aspect id or constructor.
   * @param aspect - The aspect id or constructor to find.
   * @returns The aspects maching the given id, or an empty array if no aspects found. Returns all aspects if no parameter given.
   */
  getAspects<T = AspectType>(aspect?: string | (new () => T)): T[];
}
