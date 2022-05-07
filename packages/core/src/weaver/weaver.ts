import type { AspectType } from '../aspect/aspect.type';

/**
 * A Weaver is some sort of processor that invoke the advices according to the enabled aspects
 * @public
 */
export interface Weaver {
  /**
   * Enable some aspects.
   * @param aspects - the aspects to enable
   */
  enable(...aspects: AspectType[]): this;

  /**
   * Disable some aspects.
   * @param aspects - the aspects to disable
   */
  disable(...aspects: (AspectType | string)[]): this;

  /**
   * Enable or disable an aspect
   * @param aspect - the aspect to enable or disable
   * @param enabled - enable or disable the given aspect
   */
  setEnabled(aspect: AspectType, enabled: boolean): this;

  /**
   * Find an aspect among registered aspect given its aspect id or constructor.
   * @param aspect - the aspect id or constructor to find.
   * @returns The aspect if registered, undefined otherwise
   */
  getAspect<T extends AspectType>(
    aspect: string | (new () => T),
  ): T | undefined;

  /**
   * Get all registered aspects
   */
  getAspects(): AspectType[];
}
