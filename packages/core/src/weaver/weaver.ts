import { ConstructorType } from '@aspectjs/common/utils';
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
   * Find an aspect among enabled aspects given an aspect id or constructor.
   * @param aspect - The aspect id or constructor to find.
   * @returns The aspects maching the given id, or undefined
   */
  getAspect<T = AspectType>(
    aspect: string | ConstructorType<T>,
  ): (T & AspectType) | undefined;

  /**
   * Find all aspects among enabled aspects given.
   * @returns all aspects registered
   */
  getAspects(): AspectType[];
}
